const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/push-client.js'), 'utf8');
const APP = '11111111-1111-4111-8111-111111111111';
const SUB = '22222222-2222-4222-8222-222222222222';
async function setup(options = {}) {
  const elements = new Map(), callbacks = {}, timers = [], scripts = [];
  const element = id => {
    if (!elements.has(id)) elements.set(id, { dataset: {}, handlers: {}, hidden: false, disabled: false, textContent: '', value: '', addEventListener(name, fn) { this.handlers[name] = fn; }, select() {} });
    return elements.get(id);
  };
  let opted = 0, optedOut = 0, initializations = 0, initOptions;
  const context = { console, URL, Error, Promise, setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {}, matchMedia: () => ({ matches: !!options.standalone }),
    location: { origin: options.origin || 'https://spfc-hoje.vercel.app', reload() {} },
    navigator: { userAgent: options.ios ? 'iPhone' : 'Chrome', platform: options.ios ? 'iPhone' : 'Linux', maxTouchPoints: options.ios ? 5 : 0, serviceWorker: {}, clipboard: { writeText: async () => {} } },
    Notification: { permission: options.permission || 'default' }, PushManager: function () {}, isSecureContext: true,
    SPFCPushConfig: { enabled: true, appId: APP, siteOrigin: 'https://spfc-hoje.vercel.app', ...options.config },
    document: { hidden: false, getElementById: element, createElement: () => ({}), head: { append: script => scripts.push(script) }, addEventListener: (name, fn) => { callbacks[name] = fn; } }
  };
  if (options.unsupported) delete context.PushManager;
  context.window = context;
  const subscription = { optedIn: !!options.active, id: options.active ? SUB : null, token: options.active ? 'browser-push-token' : null,
    addEventListener(name, fn) { callbacks.subscription = fn; },
    async optIn() { opted++; context.Notification.permission = options.deny ? 'denied' : 'granted'; if (!options.delay && !options.deny) { this.optedIn = true; this.id = SUB; this.token = 'browser-push-token'; } },
    async optOut() { optedOut++; this.optedIn = false; callbacks.subscription(); }
  };
  const sdk = { async init(value) { initializations++; initOptions = value; if (options.sdkError) throw Error('load failed'); }, User: { PushSubscription: subscription }, Notifications: { get permission() { return context.Notification.permission === 'granted'; }, addEventListener(name, fn) { callbacks.permission = fn; } } };
  vm.runInNewContext(source, context);
  await Promise.resolve();
  if (context.OneSignalDeferred && !options.skipSDK) await context.OneSignalDeferred[0](sdk);
  return { context, sdk, element, scripts, callbacks, timers, get opted() { return opted; }, get optedOut() { return optedOut; }, get initOptions() { return initOptions; }, get initializations() { return initializations; }, state: () => element('push-state').dataset.state, click: id => element(id).handlers.click() };
}
test('disabled setup loads no third-party SDK and cannot request permission', async () => {
  const h = await setup({ config: { enabled: false, appId: '' } });
  assert.equal(h.state(), 'unavailable'); assert.equal(h.scripts.length, 0); assert.equal(h.opted, 0);
});
test('only canonical origin may subscribe', async () => {
  const h = await setup({ origin: 'https://preview.example' });
  assert.equal(h.state(), 'unavailable'); assert.equal(h.element('push-canonical').href, 'https://spfc-hoje.vercel.app/notificacoes.html'); assert.equal(h.scripts.length, 0);
});
test('iOS browser gets installation instructions before SDK or permission', async () => {
  const h = await setup({ ios: true });
  assert.equal(h.state(), 'install'); assert.equal(h.element('ios-help').hidden, false); assert.equal(h.opted, 0); assert.equal(h.scripts.length, 0);
});
test('unsupported devices receive a readable state', async () => {
  const h = await setup({ unsupported: true }); assert.equal(h.state(), 'unsupported'); assert.equal(h.scripts.length, 0);
});
test('initialization keeps independent worker scope and no automatic prompts', async () => {
  const h = await setup(); assert.equal(h.state(), 'inactive'); assert.equal(h.opted, 0);
  assert.equal(h.initOptions.serviceWorkerPath, 'push/onesignal/OneSignalSDKWorker.js'); assert.equal(h.initOptions.serviceWorkerParam.scope, '/push/onesignal/');
  assert.equal(h.initOptions.autoResubscribe, false); assert.equal(h.initOptions.promptOptions.slidedown.prompts[0].autoPrompt, false); assert.equal(h.initOptions.welcomeNotification.disable, true);
});
test('explicit click subscribes and pause removes opt-in', async () => {
  const h = await setup({ ios: true, standalone: true });
  await h.click('push-enable'); assert.equal(h.opted, 1); assert.equal(h.state(), 'active'); assert.equal(h.element('push-subscription-id').value, SUB);
  await h.click('push-disable'); assert.equal(h.optedOut, 1); assert.equal(h.state(), 'inactive'); assert.equal(h.element('push-diagnostic').hidden, true);
});
test('granted permission alone is not reported as an active subscription', async () => {
  const h = await setup({ permission: 'granted' }); assert.equal(h.state(), 'inactive');
  const pending = await setup({ delay: true }); await pending.click('push-enable'); assert.equal(pending.state(), 'loading');
  await pending.click('push-enable'); assert.equal(pending.opted, 1, 'duplicate clicks while pending are ignored');
  pending.sdk.User.PushSubscription.optedIn = true; pending.sdk.User.PushSubscription.id = SUB; pending.sdk.User.PushSubscription.token = 'token'; pending.callbacks.subscription();
  assert.equal(pending.state(), 'active');
});
test('blocked permission cannot trigger repeated native prompts', async () => {
  const h = await setup({ permission: 'denied' }); assert.equal(h.state(), 'blocked'); assert.equal(h.element('push-enable').hidden, true); assert.equal(h.opted, 0);
  const denied = await setup({ deny: true }); await denied.click('push-enable'); assert.equal(denied.state(), 'blocked');
});
test('SDK error and subscription timeout show failure, never false success', async () => {
  const failed = await setup({ sdkError: true }); assert.equal(failed.state(), 'error');
  const waiting = await setup({ delay: true }); await waiting.click('push-enable'); waiting.timers.at(-1)(); assert.equal(waiting.state(), 'error');
});
test('valid saved subscription restores active state without a prompt', async () => {
  const h = await setup({ active: true, permission: 'granted' }); assert.equal(h.state(), 'active'); assert.equal(h.opted, 0);
});
