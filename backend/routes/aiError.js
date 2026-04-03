function isProviderUnavailable(message = '') {
  const m = String(message).toLowerCase();
  return (
    m.includes('ai provider unavailable') ||
    m.includes('insufficient_quota') ||
    m.includes('429') ||
    m.includes('rate limit') ||
    m.includes('openai_api_key is required') ||
    m.includes('invalid api key') ||
    m.includes('ollama')
  );
}

export function sendAIError(res, error, route) {
  const message = error?.message || 'Unknown AI error';
  const providerUnavailable = isProviderUnavailable(message);
  const statusCode = providerUnavailable ? 503 : (error?.statusCode || 500);

  return res.status(statusCode).json({
    success: false,
    source: route,
    code: statusCode,
    provider_unavailable: providerUnavailable,
    error: message,
    raw: error?.raw || null
  });
}
