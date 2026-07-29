# GET Response with custom headers

<APIEndpoint
  method={"GET"}
  path={"/headers/rate-limit"}
  summary={"Response with custom headers"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"X-Rate-Limit-Limit","in":"header","required":false,"description":"Maximum number of requests","schema":{"type":"string"}},{"name":"X-Rate-Limit-Remaining","in":"header","required":false,"description":"Remaining requests in the current period","schema":{"type":"string"}},{"name":"X-Rate-Limit-Reset","in":"header","required":false,"description":"Time when the rate limit resets","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"OK with headers"}
  contentType={"text/plain"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/headers/rate-limit"}
  parameters={[{"name":"X-Rate-Limit-Limit","in":"header","required":false,"description":"Maximum number of requests","schema":{"type":"string"}},{"name":"X-Rate-Limit-Remaining","in":"header","required":false,"description":"Remaining requests in the current period","schema":{"type":"string"}},{"name":"X-Rate-Limit-Reset","in":"header","required":false,"description":"Time when the rate limit resets","schema":{"type":"string"}}]}
  baseUrl={""}
/>

