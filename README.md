# Micah's Game (<i>ver.0.5</i>)

This is the best card game I've ever played and it was invented by my brother Micah. I am taking the time to turn this into a web app with ReactTS, Redux, Node, Jest and then (later) Websockets for online multiplayer.

## Available Scripts

In the project directory, you can run:

##### `yarn dev`

##### `yarn build`

##### `yarn preview`

##### `yarn lint`

##### `yarn lint:ts`

##### `yarn lint:eslint`

##### `yarn format:ts`

##### `yarn format`

##### `yarn format:check`

##### `yarn test`

### State Management

Redux was used for state management in the project. It is divided into redux slices to avoid complexity, ensure maintainability, and divide into domains. Use store (redux) for global states, states that you will use at many different points, and states that you will access and manage remotely.

Go to the `src/store/slices` folder. Open or create the slice file of the module whose state you will manage. If you have created a new slice, you must define it in the `src/store/index.ts` file.

### Style Management

For global styling operations, there are global sass files under the `src/styles` folder. The `vendors.scss` you will use to add your dependencies and `global.scss` for your global styles are located here. You can also create global sass files here that you want to import in other sass files like `shareds.scss` or `variables.scss`.

Components own style files should be located next to the `%componentname%.tsx` file like as `src/routes/Episode/List/List.scss`
