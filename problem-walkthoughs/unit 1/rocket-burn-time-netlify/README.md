# Rocket web app

Netlify-ready version of the Unit 1 rocket activity. The original HTML and JavaScript in the parent directory remain the source of truth.

Live website: https://icl-rocket-lab.netlify.app

Netlify project: `icl-rocket-lab` (site ID `6e519050-ea64-4f38-bdf0-9d1c10aa36f2`). Deploy future updates to this existing project.

From this directory, run `node build.cjs` to refresh `public/` after changes. Deploy only `public/`; it contains the web app's `index.html` and JavaScript. No dependencies or server are required.

For a Git-based Netlify project, set the base directory to `problem-walkthoughs/unit 1/rocket-burn-time-netlify`. The build command and publish directory are defined in `netlify.toml`.
