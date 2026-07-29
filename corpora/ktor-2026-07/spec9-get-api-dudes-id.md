# GET Get a specific dude

<APIEndpoint
  method={"GET"}
  path={"/api/dudes/{id}"}
  summary={"Get a specific dude"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"Dude ID","schema":{"type":"integer"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"Dude details"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"}},"required":["id","name"]}}
/>

<APIResponse
  statusCode={"400"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"string"}}
/>

<APIResponse
  statusCode={"404"}
  description={"Dude not found"}
  contentType={"application/json"}
  schema={{"type":"string"}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/dudes/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"Dude ID","schema":{"type":"integer"}}]}
  baseUrl={""}
/>

