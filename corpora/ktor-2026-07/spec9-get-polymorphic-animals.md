# GET Get list of animals

<APIEndpoint
  method={"GET"}
  path={"/polymorphic/animals"}
  summary={"Get list of animals"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={"List of animals (mixed Dogs and Cats)"}
  contentType={"application/json"}
  schema={{"type":"array","items":{"type":"object"}}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/polymorphic/animals"}
  parameters={[]}
  baseUrl={""}
/>

