export default defineEventHandler((event) => {
  const query = getQuery(event);
  const statusCode = query.status;

  if (statusCode) {
    setResponseStatus(event, Number(statusCode));
    return useResponseError(`Status ${statusCode} test`);
  }

  return useResponseSuccess('Status API is working');
});
