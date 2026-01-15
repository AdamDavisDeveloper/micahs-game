# Micah's Game - Animations Library + Testing Lab

#### Quick Info:
- `/animations/lib/` is the official library which will contain exports for use in game
- `/animations/lab/` is where test/scrap code can live until ready for library inclusion.
- `/animations/assets/` contains any images/gifs/svgs/etc.

-------------------

## Dev Contribution Guide
When contributing code to this project as an approved collaborator, you have permissions to commit code, create/delete branches, etc., and it'll be helpful to know exactly what to do.

#### General Guidelines:
1. Commit code often to keep commits small and easy to understand.
2. Use good commit messages - Explain what changed
3. Always commit changes to the `animations` branch
4. <i>(optional)</i> If you want additional branches to keep your working ideas separate, branch off of the `animations` branch and name the newly created branch `animations-<branchname>`, then just merge your new branch into `animations` whenever you want.
5. I (adam) will probably never touch the `animations` branch other than to occasionally merge in `origin/master` to keep `origin/animations` up-to-date. A pull-request will need to be made in order to merge the `animations` branch into `master`.
6. Before the `animations` branch can be merged into `master`, the `/animations/lab/` directory should be cleared out of unnecessary files and code. The `/animations/lib/` should contain new, usable, and clean exported functions, data, etc., which can be integrated into the current UI.

## Getting the dev environment running
Follow these steps - I will keep updated if anything changes.

#### Start Vite dev server with yarn
1. If you haven't done this already, in the root of this project, run `yarn` in your terminal to fetch required packages <i>(note: if you don't have yarn, just install it globally on your machine the same way as you would with npm).</i>
2. In the root of this project, run `yarn run dev` which should start the dev server with hot-module-reload.
3. Open browser to the `localhost:PORT` url found in the server terminal

#### See Your Changes
- I added a route called AnimLab which is linked on the `/` home route. `localhost:PORT/AnimLab` is where you can see your changes.
- You can make edits to the React page UI and see your changes by editing the file in: `routes/AnimLab/index.tsx` -- you can import your animation code to that file for viewing.
This might seem odd to keep the animation code and the animation testing lab UI code in two completely different places but this pattern allows for better separation of concerns and will guide us into creating a resusable animation library.
