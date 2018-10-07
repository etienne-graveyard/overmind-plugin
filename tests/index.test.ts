import { plugin, resolvePlugins } from '../src/index';
import App from 'overmind';

describe('top config is passed', () => {
  test('state', () => {
    expect(
      resolvePlugins({
        state: {
          foo: 'bar',
        },
      }).state
    ).toEqual({ foo: 'bar' });
  });

  test('actions', () => {
    const doFoo = ({ run }: any) => run(() => {});
    expect(
      resolvePlugins({
        actions: {
          foo: doFoo,
        },
      }).actions.foo
    ).toBe(doFoo);
  });
});

test('it instantiate without crashing', () => {
  expect(
    new App(
      resolvePlugins({
        state: {
          yolo: true,
        },
      })
    )
  ).toBeInstanceOf(App);
});
