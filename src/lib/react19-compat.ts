import React from 'react';

// Compatibility shim for third-party libraries (e.g. iran-regions) compiled against React 18 internals
const r = (React as any)?.default || React;
const internals =
  (r as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE || {
    ReactCurrentOwner: { current: null },
    ReactCurrentDispatcher: { current: null },
    ReactCurrentActQueue: { current: null },
  };

if (r && !(r as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  (r as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
}

if (typeof window !== 'undefined') {
  const win = window as any;
  if (win.React && !win.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    win.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
  }
}

