# GET This endpoint is for testing type references.

<APIEndpoint
  method={"GET"}
  path={"/type-references"}
  summary={"This endpoint is for testing type references."}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"object"}}
/>

<APIResponse
  statusCode={"429"}
  description={"Is it tea time already?"}
  contentType={"application/json"}
  schema={{"format":"date-time"}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/type-references"}
  parameters={[]}
  baseUrl={""}
/>

