import { EmptyIfNever, WithoutNeverDeep } from './internal';
import isPlainObject from 'is-plain-object';

type Configuration = {
  onInitialize?: any;
  state?: any;
  effects?: any;
  actions?: any;
  reactions?: any;
  plugins?: object;
};

// We use a symbol so user can't create a FlatPlugin themself
export const PLUGIN_TOKEN = Symbol('Plugin');

export type Plugin<Config extends Configuration> = {
  [PLUGIN_TOKEN]: true;
  __state: TState<Config>;
  __actions: TActions<Config>;
  __effects: TEffects<Config>;
};

type FlatPluginAny = {
  [PLUGIN_TOKEN]: true;
  __state: any;
  __actions: any;
  __effects: any;
};

/**
 * State
 */

type ExtractPluginState<T> = EmptyIfNever<
  WithoutNeverDeep<
    T extends FlatPluginAny
      ? (keyof T['__state'] extends never ? {} : T['__state'])
      : (T extends object ? { [K in keyof T]: ExtractPluginState<T[K]> } : T)
  >
>;

type Test = 'state' extends keyof { state: {} } ? true : false;

// prettier-ignore
export type TState<Config extends Configuration> = (
  ([Config['state']] extends [undefined] ? {} : Config['state']) &
  ([Config['plugins']] extends [undefined] ? {} : ExtractPluginState<Config['plugins']>)
)

/**
 * Actions
 */

export type ExtractPluginActions<T> = EmptyIfNever<
  WithoutNeverDeep<
    T extends FlatPluginAny
      ? (keyof T['__actions'] extends never ? never : T['__actions'])
      : (T extends object ? { [K in keyof T]: ExtractPluginActions<T[K]> } : T)
  >
>;

// prettier-ignore
export type TActions<Config extends Configuration> = (
  ([Config['actions']] extends [undefined] ? {} : Config['actions']) &
  ([Config['plugins']] extends [undefined] ? {} : ExtractPluginActions<Config['plugins']>)
)

/**
 * Effects
 */

type ExtractPluginEffects<T> = EmptyIfNever<
  WithoutNeverDeep<
    T extends FlatPluginAny
      ? (keyof T['__effects'] extends never ? never : T['__effects'])
      : (T extends object ? { [K in keyof T]: ExtractPluginEffects<T[K]> } : T)
  >
>;

// prettier-ignore
export type TEffects<Config extends Configuration> = (
  ([Config['effects']] extends [undefined] ? {} : Config['effects']) &
  ([Config['plugins']] extends [undefined] ? {} : ExtractPluginEffects<Config['plugins']>)
)

/**
 * Create a plugin
 */

export function plugin<Config extends Configuration>(
  config: Config | ((path: Array<string>) => Config)
): Plugin<Config> {
  return ((path: Array<string>) => {
    const resolvedConf = typeof config === 'function' ? config(path) : config;
    (resolvedConf as any)[PLUGIN_TOKEN] = true;
    return resolvedConf;
  }) as any;
}

/**
 * Resolve plugins into config
 */

function setIn(target: any, path: Array<string>, value: any) {
  const parent = path.slice(0, -1).reduce((acc, key) => acc[key], target);
  parent[path[path.length - 1]] = value;
}

function setInSafe(target: any, path: Array<string>, value: any) {
  const parent = path.slice(0, -1).reduce((acc, key) => {
    if (acc[key] === undefined) {
      acc[key] = {};
    }
    return acc;
  }, target);
  parent[path[path.length - 1]] = value;
}

function mutatePluginFunctionsIntoPlugins(config: Configuration) {
  const transformPlugin = (val: any, path: Array<string>) => {
    if (typeof val === 'function') {
      const resolved = val(path);
      if (resolved[PLUGIN_TOKEN] !== true) {
        console.warn(`Plugins must be wrapped in 'plugin()'`);
        return;
      }
      setIn(config.plugins, path, resolved);
      if (resolved.plugins) {
        Object.keys(resolved.plugins).forEach(key => {
          transformPlugin(resolved.plugins[key], [...path, key]);
        });
      }
      return;
    }
    if (!isPlainObject(val)) {
      console.warn(`Plugins must contains only 'plugins()' and plain objects`);
      return;
    }
    Object.keys(val).forEach(key => {
      transformPlugin(val[key], [...path, key]);
    });
  };

  if (config.plugins) {
    transformPlugin(config.plugins, []);
  }
}

function traversePlugins(config: Configuration, onTraverse: (plugin: any, path: Array<string>) => void) {
  if (config.plugins) {
    const traverse = (val: any, path: Array<string>) => {
      if (val[PLUGIN_TOKEN] === true) {
        onTraverse(val, path);
        return;
      }
      Object.keys(val).forEach(key => {
        traverse(val[key], [...path, key]);
      });
    };

    traverse(config.plugins, []);
  }
}

function getConfigKey(configuration: Configuration, key: keyof Configuration) {
  let acc = {};
  // basic state
  if (configuration[key]) {
    acc = configuration[key];
  }
  // plugins state
  traversePlugins(configuration, (plugin, path) => {
    if (plugin[key]) {
      setInSafe(acc, path, plugin[key]);
    }
  });
  return acc;
}

function getInitializers(configuration: Configuration) {
  let initializers: Array<any> = [];
  if (configuration.onInitialize) {
    initializers.push(configuration.onInitialize);
  }
  traversePlugins(configuration, (plugin, path) => {
    if (plugin.onInitialize) {
      plugin.onInitialize.displayName = path.join('.') + '.onInitialize';
      initializers = initializers.concat(plugin.onInitialize);
    }
  });
  if (initializers.length === 0) {
    return undefined;
  }
  if (initializers.length === 1) {
    return initializers[0];
  }
  // We reverse the array because we want toinitialize the deepest plugins first
  const onInitializeParallel = (action: any) => action.parallele(initializers.reverse());
  (onInitializeParallel as any).displayName = 'onInitialize';
  return onInitializeParallel;
}

export function resolvePlugins<Config extends Configuration>(config: Config) {
  mutatePluginFunctionsIntoPlugins(config);
  return {
    state: getConfigKey(config, 'state') as TState<Config>,
    effects: getConfigKey(config, 'effects') as TEffects<Config>,
    actions: getConfigKey(config, 'actions') as TActions<Config>,
    reactions: getConfigKey(config, 'reactions') as any,
    onInitialize: getInitializers(config) as any,
  };
}
