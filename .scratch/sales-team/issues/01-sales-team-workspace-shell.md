# 01: Sales Team Workspace Shell & Navigation

**What to build:** A merchant can navigate to a dedicated "Sales Team" workspace from the primary sidebar without affecting existing operational tabs. The workspace renders a Team Room overview shell with a pending-approval badge, an active session header, and an empty/idle state explaining the five-agent sales intelligence department.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Add `sales_team` tab to navigation in `src/App.tsx` positioned between operational tools and existing strategy desk
- [x] Render a new decoupled component tree in `src/features/sales-team/components/TeamRoom.tsx`
- [x] Show a pending approval badge indicator on the sidebar tab when actions require review
- [x] Display store connection and data freshness status header in the Team Room shell
- [x] Ensure switching between `sales_team` and other tabs (`orders`, `products`, `delivery`, `insights`) is seamless with zero layout regression

