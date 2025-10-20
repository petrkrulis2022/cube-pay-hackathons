# Manual Dependency Installation for Cube Pay Hackathons Monorepo

This document outlines the steps to manually install dependencies for the `cube-pay-hackathons` monorepo. This is an alternative to running `npm run install:all` if you encounter issues, or prefer a step-by-step approach.

## Prerequisites

Ensure you have Node.js (>=18.0.0) and npm (>=9.0.0) installed on your system.

## Installation Steps

Follow these steps from your terminal:

1.  **Navigate to the Monorepo Root Directory:**

    ```bash
    cd ~/cube-pay-hackathons
    ```

2.  **Install Root Dependencies (e.g., `concurrently`):**

    The root `package.json` defines `concurrently` as a `devDependency` which is crucial for running `dev` scripts across workspaces. Install it globally or in the root `node_modules`.

    ```bash
    npm install concurrently --save-dev
    ```

3.  **Install Frontend Dependencies:**

    Navigate into the `frontend` directory and install its specific dependencies. Use `--legacy-peer-deps` if you encounter peer dependency conflicts.

    ```bash
    cd frontend
    npm install --legacy-peer-deps
    cd ..
    ```

4.  **Install Backend Dependencies:**

    Navigate into the `backend` directory and install its specific dependencies. Use `--legacy-peer-deps` if you encounter peer dependency conflicts.

    ```bash
    cd backend
    npm install --legacy-peer-deps
    cd ..
    ```

## Verification

After completing these steps, your monorepo should have all necessary dependencies installed. You can then try running the combined development script:

```bash
npm run dev
```

This command, defined in the root `package.json`, will use `concurrently` to start both the frontend and backend development servers.
