# Claude Code Specification: Hairspring Tier Logic Migration

1. Objective

- Refactor the subscription logic from a strict time-based 14-day trial to a value-capped Freemium structure. Free users receive basic functionality limited by asset volume, while Pro users unlock unlimited tracking and advanced multi-position data arrays.

2. Tier Feature Matrix

- Free Tier:
  - Maximum 2 Active Projects at any given time.
  - Maximum 3 Photos uploaded per project.
  - Single-entry Timegrapher logging (flat text/numeric rate and amplitude metrics).
  - Public Profile enabled (Kept free for organic attribution loop).
- Pro Tier:
  - Unlimited Active Projects.
  - Unlimited Photos.
  - Advanced Positional Timegrapher Log (Grid layout for up to 6 physical positions with automated delta tracking).

3. Backend Validation Rules (API Enforcement)
   Implement middleware or service-layer validation to prevent users from bypassing the frontend UI constraints.

A. Project Creation Constraint
Before saving a new watch project, check the current active count if the user is on the free tier.

B. Photo Upload Constraint
Before accepting an image payload via your S3/Cloudinary upload endpoint, verify the count for that specific watch asset.

4. Frontend & UI Adjustments
   A. Timegrapher Logging UI
   - If user is on the free tier - Display a simple input card containing two fields: Average Rate (s/d) and Average Amplitude (°).
   - If user is on the pro tier - Expose a tabular data entry grid mapping standard positions (DU, DD, CD, CL, CU, CR). Add a visual dashboard widget displaying a calculated Delta line graph across historical logs.
