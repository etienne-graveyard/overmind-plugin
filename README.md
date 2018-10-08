<div align="center">
<br>
<img src="https://github.com/etienne-dldc/overmind-plugin/blob/master/assets/logo.svg" width="600px">
<br>
</div>

# Overmind Plugin

A plugin system for [overmind](https://www.overmindjs.org/) allowing deeply nested `state`, `actions`, `reactions`, `effects` and `onInitialize`.

```
npm install overmind-plugin
```

## Usage

```js
import { resolvePlugins } from 'overmind-plugin';
import App from 'overmind';

const config = {
  state: {
    /* ... */
  },
  actions: {
    /* ... */
  },
};

const app = new App(resolvePlugins(config));
```

Now your `config` support a new `plugins` field where you can put nested config:

```js
import { plugin } from 'overmind-plugin';

const config = {
  state: { foo: 'bar' },
  actions: { doStuff: actions.doStuff }
  plugins: {
    firstPlugin: plugin({
      state: { isPlugin: true },
      actions: { doStuffFromPlugin: actions.doStuffFromPlugin }
    })
  }
}
```

...is the same as

```js
const config = {
  state: {
    foo: 'bar',
    firstPlugin: {
      isPlugin: true,
    },
  },
  actions: {
    doStuff: actions.doStuff,
    firstPlugin: {
      doStuffFromPlugin: actions.doStuffFromPlugin,
    },
  },
};
```

## Deep plugins

Plugins don't have to be at the first level of `plugins` they can be as deep as you want. Just remember to wrap your plugin config a a `plugin()` call to identify what is a plugin and what is just structure:

```js
const config = {
  plugins: {
    admin: {
      dashboard: plugin(dashboardConfig),
    },
    user: plugin(userConfig),
  },
};
```

## Nested plugins

The config passed to `plugin()` also support a `plugins` field so you can do:

```js
const config = {
  plugins: {
    admin: plugin({
      state: {},
      plugins: {
        dashboard: plugin(dashboardConfig),
      },
    }),
  },
};
```

## Dynamic plugins

The `plugin()` function can accept a function instead of an object. This function will receive the `path` where the plugin is as an array of strings:

```js
const myPlugin = plugin(path => {
  return {
    state: {},
    actions: {},
  };
});

const config = {
  plugins: {
    admin: {
      dashboard: myPlugin, // path will be ['admin', 'dashboard']
    },
    user: myPlugin, // path will be ['user']
  },
};
```

## Plugin factory

You can easily abtract logic with a plugin factory:

```js
const myPluginFactory = options =>
  plugin(path => {
    return {
      state: {},
      actions: {},
    };
  });

const config = {
  plugins: {
    admin: {
      dashboard: myPluginFactory({}),
    },
    user: myPluginFactory({}),
  },
};
```

## External library

You can publish your plugin factory as a package so other can use it too. All you have to do is document how to support `plugins` with overmind.
