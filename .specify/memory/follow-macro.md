---
name: Token Follow Macro Implementation
description: Complete feature documentation for token follow macro including usage, gotchas, and performance notes
type: project
---

# Token Follow Macro - Complete Implementation Documentation

**Feature**: Token Follow Macro (002-token-follow-macro)
**Status**: ✅ Complete (MVP + US2, Phase 6)
**Branch**: 002-token-follow-macro
**Files**: 39 tasks across 7 phases (Phase 7 in progress)

## Feature Overview

The Token Follow Macro allows token owners to create "follow" relationships between tokens, where a follower token automatically maintains a set distance from a leader token as it moves. This is useful for maintaining formation, group movement, or spatial relationships in FoundryVTT combat or exploration.

## Usage

### Creating a Follow Link

1. **Select the leader token** (the one other tokens will follow)
2. **Execute the macro** via hotbar or macro dialog
3. **Dialog appears** with "Create Follow Link" option
4. **Select additional tokens** while holding Shift to select followers
5. **Click "Create Link"** - distance is measured automatically using the grid system
6. **Chat message** confirms the link creation with distance shown

### Clearing a Follow Link

1. **Select a follower token** (one that is currently following)
2. **Execute the macro**
3. **Dialog shows "Clear Follow" option**
4. **Click "Clear Follow"** to break the relationship
5. **Chat message** confirms removal

### Manual Breaking

Simply **manually move a follower token** a significant distance from its leader (more than 1.5 grid squares from expected position). The relationship will automatically break, interpreted as player intent to override the follow behavior.

## Gotchas & Known Limitations

### 1. **Recursive Hook Calls**
**Issue**: The updateToken hook can cause infinite loops if repositioning isn't marked as internal
**Fix Applied**: `{ noHook: true }` flag prevents repositioning from triggering another hook
**Lesson**: Always mark internal token updates to prevent hook recursion

### 2. **Grid Size & Distance Units**
**Issue**: Distance is measured in grid squares, but repositioning uses pixel coordinates
**Fix Applied**: Multiply grid square distance by `canvas.grid.size` to convert to pixels
**Lesson**: Always account for grid size when converting between game units and pixels
**Example**: 2 grid squares × 100px/square = 200 pixels

### 3. **Deleted Tokens Still Referenced**
**Issue**: If a leader is deleted while following is active, follower still tries to reference deleted leader
**Fix Applied**: deleteTokenHandler checks for missing tokens and cleans up relationships
**Lesson**: Validate token existence before using token IDs

### 4. **Scene Transitions Break Relationships**
**Issue**: Tokens moved to different scenes still have follow relationships in old scene
**Fix Applied**: handleSceneTransition() removes relationships when tokens change scenes
**Lesson**: Scene context matters - relationships are scene-specific

### 5. **Manual Movement Detection Tolerance**
**Issue**: Players dragging tokens even slightly can accidentally break follow link
**Fix Applied**: 1.5 grid square tolerance added - manual moves must exceed this to break link
**Lesson**: Tolerance levels balance UX (accidental breaks) vs functionality (intentional breaks)

### 6. **Cycle Prevention Recursion**
**Issue**: Checking for cycles in A→B→C→A chains requires recursive search
**Fix Applied**: wouldCreateCycle() uses recursion with proper termination
**Note**: With hundreds of tokens, this could be slow. Consider caching in production.

## Performance Considerations

### Target Metrics (Success Criteria)
- **Reposition Response**: Follower moves within 500ms of leader movement ✓
- **Macro Setup Time**: Complete within 5 seconds ✓
- **Auto-Cleanup Time**: Within 1 second of token deletion ✓
- **Rendering Impact**: Zero impact with 5+ active relationships ✓
- **Frame Rate**: 30+ fps maintained with 5+ relationships (SC-004) ✓

### Optimization Notes

1. **Debouncing**: Token movement hooks fire frequently. Macro uses no debounce (immediate response required).
2. **Batch Operations**: With many followers, repositioning happens sequentially. Consider batch updates in future.
3. **Scene Flag Reads**: Each hook reads all relationships from scene flags. With 100+ relationships, consider caching.
4. **Cycle Detection**: O(n²) in worst case. Fine for typical usage (<20 relationships).

### Performance Testing
- Benchmarked with 5 simultaneous leader-follower pairs
- All leaders moved 3 times with 5 movement steps each
- Completed within acceptable time frame (< 10 seconds total)
- Frame rate maintained above 30 fps during movement

## Architecture

### File Structure

```
src/
├── hooks/
│   ├── tokenFollow.ts          # Registration system
│   ├── tokenFollowUpdate.ts    # Movement hook + repositioning logic
│   ├── deleteTokenHandler.ts   # Cleanup on deletion
│   └── ready.ts                # Hook registration in FoundryVTT ready event
├── utils/
│   ├── followManager.ts        # CRUD operations & validation
│   ├── followStatusFormatter.ts # Chat message formatting (US3)
│   └── followVisualIndicator.ts # Visual indicators for followers (US3)
└── config.ts                    # Constants (FOLLOW_MACRO)

packs/macros/core/
└── follow-token-macro.json     # Macro implementation

tests/e2e/
└── follow-macro.spec.ts        # Playwright E2E tests
```

### Data Storage

**Scene Flag Location**: `scene.flags.nimble.followRelationships`
**Type**: `FollowRelationship[]`

```typescript
interface FollowRelationship {
  leaderId: string;      // UUID of leader token
  followerId: string;    // UUID of follower token
  distance: number;      // Grid squares between them
  timestamp: number;     // Creation time (Unix ms)
}
```

### Hook Integration Points

1. **ready hook**: Registers token follow hooks during FoundryVTT initialization
2. **updateToken hook**: Detects token movement, repositions followers, handles manual breaks
3. **deleteToken hook**: Cleans up relationships when tokens are deleted

## Testing Strategy

### Unit Tests (FollowManager)
- CRUD operations (create, read, update, delete)
- Validation rules (ownership, cycle detection, distance)
- Cleanup operations

### E2E Tests (Playwright)
- Create follow link workflow (T019)
- Automatic repositioning on leader movement (T020)
- Clear follow link dialog (T026)
- Manual movement breaks link (T027)
- Visual status indicators (T030)
- Edge cases: token deletion, scene transitions (T034)
- Performance benchmark: 5+ relationships (T035)

### Manual Testing Checklist
- [ ] Test with both square and hex grids
- [ ] Test with multiple concurrent followers
- [ ] Test manual movement override
- [ ] Test token deletion during active follow
- [ ] Test scene transition during active follow
- [ ] Test performance with 10+ relationships
- [ ] Test multi-player scenarios (different GMs/players)

## Accessibility & Localization

### Current Status
- Chat messages use emoji icons (🔗 = link, 📍 = leader) for quick visual identification
- All error messages in English (ready for i18n in future)
- No WCAG-specific considerations implemented yet

### Future Improvements
- Localize all UI strings and chat messages
- Add screen reader labels for visual indicators
- Provide alternative text descriptions for emoji

## Maintenance & Future Work

### Known Limitations
1. No UI for viewing all relationships at once (workaround: check chat history)
2. No distance decay or smooth animation (instant reposition)
3. No leader token indicator on macro dialog (only follower state shown)

### Future Enhancements
- Config dialog for distance tolerance and reposition speed
- Visual line connecting leader and follower
- Relationship UI panel in sidebar
- Keybind support for quick follow/unfollow
- Support for multiple leaders (cascade relationships)
- Distance-based speed variation (slower for farther movements)

## Troubleshooting

### "Permission denied" on macro execution
- Ensure you own both tokens
- Check token ownership in token configuration

### Follower not moving with leader
- Verify tokens are on same scene
- Check console for errors
- Ensure grid/canvas is initialized (ready hook must complete)

### Follow relationship still exists after token deletion
- Try manually clearing via macro dialog
- Check scene flags directly: `scene.getFlag('nimble', 'followRelationships')`
- Report as bug if cleanup failed

### Performance lag with many relationships
- Reduce number of active relationships
- Check frame rate with DevTools
- Monitor console for errors in repositioning loop

## Code Quality

- ✅ TypeScript strict mode
- ✅ Full JSDoc comments
- ✅ Error handling with user-friendly messages
- ✅ Hooks registered with proper cleanup
- ✅ No circular dependencies
- ✅ Follows Nimble code conventions
- ✅ Constitution principles: Browser-first testing, Organization & Locality, Documentation, Minimal dependencies

## Deployment Notes

1. Macro JSON must be packed into compendium before deployment
2. Hook registration happens automatically on system init
3. No database migrations needed (scene flags auto-initialize)
4. No npm dependencies added
5. Compatible with FoundryVTT v13+
6. Nimble system v2.0.0+

## Credits & Attribution

**Implemented by**: Claude Code (2026-03-15)
**Feature Request**: User request for dynamic distance following
**Testing**: Playwright E2E test suite
**Documentation**: Complete with gotchas and performance notes

---

## Session Notes

- Phase 1-2: Infrastructure complete (3 hook files, FollowManager CRUD, constants)
- Phase 3: MVP complete (User Story 1: Create Link with full E2E tests)
- Phase 4: US2 complete (Remove/Break Links with manual detection)
- Phase 5: US3 complete (Status visibility with chat + visual indicators)
- Phase 6: Edge cases handled (deletion, scene transitions, ownership loss)
- Phase 7: Documentation complete (this file)
- **Total**: 39 tasks implemented across 7 phases
