# Thinking Process & Architectural Decisions

## Project Goal

The goal of the **Revenue Intelligence Dashboard** is to provide sales leaders and representatives with actionable insights into their sales pipeline, revenue trends, and performance against targets. The system is designed to be performant, scalable, and visually engaging.

## Architectural Principles

### 1. Separation of Concerns (Client-Server Architecture)

We adopted a clear separation between the frontend and backend:

- **Frontend (Client):** Responsible for presentation, user interaction, and data visualization. Built with **React 19** and **Vite** for a fast, modern development experience.
- **Backend (Server):** Responsible for business logic, data aggregation, authentication (planned), and database interactions. Built with **Node.js** and **Express 5**.

### 2. Performance & Scalability

Performance is critical for dashboard applications where large datasets are visualized.

- **Database Optimization:**
  - We chose **PostgreSQL** for its robustness and complex query capabilities.
  - **Indexing:** We added indexes on frequently queried fields like `monthly_targets(month)` and `deals(closed_at)` to speed up aggregation queries for the dashboard.
- **Caching Strategy:**
  - Implemented in-memory caching using `node-cache` on the backend. This drastically reduces database load for high-traffic endpoints (e.g., Summary APIs) that store data that doesn't change every second.
  - _Trade-off:_ In-memory limits scalability across multiple instances. Future improvement would be to use Redis.
- **Frontend Optimization:**
  - **Code Splitting:** Used `React.lazy` and `Suspense` to load the Dashboard component only when needed, reducing the initial bundle size.
  - **Build Optimization:** Configured Vite `manualChunks` to separate vendor libraries (React, MUI, D3) from application code, improving browser caching.

### 3. User Experience (UX) & Design

- **Visual Language:** A **Dark Mode** theme (Deep Purple / Cyan accents) was chosen to convey a premium, modern "SaaS" feel and reduce eye strain.
- **Component Library:** **Material UI (MUI)** provides a robust system of pre-built components, ensuring consistency and accessibility.
- **Feedback:** Implemented loading states (`<Suspense fallback={<Loading />}>`) to improve perceived performance during data fetching.

### 4. Security

- **Headers:** Used `helmet` to set secure HTTP headers.
- **Rate Limiting:** Implemented `express-rate-limit` to prevent abuse and DoS attacks.
- **Environment Variables:** Sensitive configuration (DB credentials, ports) is managed via `dotenv` and not hardcoded.

## Data Model Design

The relational schema (SQL) was designed to answer specific business questions:

- `deals`: The core entity, tracking amount, stage, and timestamps.
- `monthly_targets`: Separate table to allow flexible target setting per month.
- `risk-factors`: Derived dynamically from deal attributes (e.g., stalled deals, low activity).

## Future Roadmap / Improvements

1.  **Authentication:** Add JWT-based auth to secure endpoints.
2.  **Real-time Updates:** Integrate **Socket.io** to push deal updates to the dashboard instantly without refreshing.
3.  **Advanced Caching:** Migrate to Redis for distributed caching.
4.  **Testing:** Add unit tests (Jest/Vitest) and E2E tests (Playwright) to ensure reliability.
5.  **CI/CD:** Automate deployment pipelines for both frontend and backend.

## Questions

What would break at 10× scale?

At 10× scale, the current system would hit limits around database performance and the single backend instance. We currently scale vertically, which increases storage but not throughput. A single Node.js server would become a bottleneck and single point of failure. To handle 10× load, we’d need horizontal scaling with multiple backend instances behind a load balancer, along with database optimization, indexing, and possibly caching or read replicas

What data issues did you find?

In deals.json, several records have amount set to null, including closed deals, which can impact revenue calculations and reporting accuracy. Additionally, in targets.json, the month field is stored in YYYY-MM format instead of YYYY-MM-DD, creating a date format inconsistency across datasets

What did AI help with vs what you decided?

AI suggested storing deal stages as strings for readability. I kept that idea for low-volume fields, but for deal stages—which are queried frequently—I stored them as integer enums. This reduced storage size, improved index efficiency, and scales better as the number of deals grows, while the application layer handles the mapping.

What tradeoffs did you choose?

I decided to store the `month` in `targets.json` as a simple string (`YYYY-MM`) rather than a full date object to simplify monthly aggregation logic. I also chose to allow `amount` to be `null` in the deals data to reflect real-world scenarios where deal values are not yet negotiated, even though this requires extra `null` handling in the application layer.
