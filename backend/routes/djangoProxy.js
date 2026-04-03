const DJANGO_GRAPHQL_URL = process.env.DJANGO_GRAPHQL_URL || 'http://localhost:8000/graphql/';

const BRIDGE_FAIL_THRESHOLD = 3;
const BRIDGE_COOLDOWN_MS = 15000;

const bridgeState = {
  consecutiveFailures: 0,
  circuitOpenUntil: 0,
  lastError: null,
  lastSuccessAt: null,
  lastFailureAt: null
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCircuitOpen() {
  return Date.now() < bridgeState.circuitOpenUntil;
}

function markSuccess() {
  bridgeState.consecutiveFailures = 0;
  bridgeState.circuitOpenUntil = 0;
  bridgeState.lastError = null;
  bridgeState.lastSuccessAt = new Date().toISOString();
}

function markFailure(error) {
  bridgeState.consecutiveFailures += 1;
  bridgeState.lastError = error?.message || String(error);
  bridgeState.lastFailureAt = new Date().toISOString();
  if (bridgeState.consecutiveFailures >= BRIDGE_FAIL_THRESHOLD) {
    bridgeState.circuitOpenUntil = Date.now() + BRIDGE_COOLDOWN_MS;
  }
}

function isRetryableError(error) {
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('timeout') || msg.includes('abort') || msg.includes('fetch failed') || msg.includes('http 5');
}

export function getDjangoBridgeStatus() {
  return {
    url: DJANGO_GRAPHQL_URL,
    circuit_open: isCircuitOpen(),
    circuit_open_until: bridgeState.circuitOpenUntil ? new Date(bridgeState.circuitOpenUntil).toISOString() : null,
    consecutive_failures: bridgeState.consecutiveFailures,
    last_error: bridgeState.lastError,
    last_success_at: bridgeState.lastSuccessAt,
    last_failure_at: bridgeState.lastFailureAt
  };
}

export async function callDjangoGraphQL(query, variables = {}, timeoutMs = 25000) {
  if (isCircuitOpen()) {
    throw new Error('Django bridge circuit is open');
  }

  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(DJANGO_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(`Django GraphQL HTTP ${response.status}`);
      }

      if (json.errors?.length) {
        throw new Error(json.errors[0].message || 'Django GraphQL error');
      }

      markSuccess();
      return json.data || {};
    } catch (error) {
      lastError = error;
      markFailure(error);
      if (attempt < 2 && isRetryableError(error)) {
        await sleep(350);
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error('Django GraphQL unavailable');
}
