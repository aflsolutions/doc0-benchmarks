# GET Response with cache control headers

<APIEndpoint
  method={"GET"}
  path={"/headers/cache"}
  summary={"Response with cache control headers"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"Cache-Control","in":"header","required":false,"description":"Caching directives","schema":{"type":"string"}},{"name":"ETag","in":"header","required":false,"description":"Entity tag for cache validation","schema":{"type":"string"}},{"name":"Last-Modified","in":"header","required":false,"description":"Last modification date","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"OK with cache headers"}
  contentType={"text/plain"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/headers/cache"}
  parameters={[{"name":"Cache-Control","in":"header","required":false,"description":"Caching directives","schema":{"type":"string"}},{"name":"ETag","in":"header","required":false,"description":"Entity tag for cache validation","schema":{"type":"string"}},{"name":"Last-Modified","in":"header","required":false,"description":"Last modification date","schema":{"type":"string"}}]}
  baseUrl={""}
/>

