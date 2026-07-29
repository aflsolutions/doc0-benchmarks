# Resource Tree and Terminal

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx)
- [ui/src/app/applications/components/application-details/application-details.tsx](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx)
- [ui/src/app/applications/components/resource-details/resource-details.tsx](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx)
- [ui/src/app/applications/components/application-pod-view/pod-view.tsx](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-pod-view/pod-view.tsx)
- [server/application/terminal.go](https://github.com/argoproj/argo-cd/blob/main/server/application/terminal.go)
- [ui/src/app/applications/components/application-details/application-resource-list.tsx](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx)
- [server/application/application.go](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go)
</details>

## Overview

The **Resource Tree and Terminal** component within Argo CD provides an interactive, real-time visualization and management interface for deployed application topologies and underlying Kubernetes workloads. It bridges high-level application synchronization states with granular resource inspection by rendering hierarchical node graphs, tabular resource views, and pod-centric infrastructure maps. Users can inspect live specifications, analyze sync and health diffs, examine event logs, and securely execute terminal sessions directly inside container workloads through authenticated WebSocket streams, backed by robust RBAC enforcement and namespace visibility checks.

Sources: [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:57-82](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L57-L82), [ui/src/app/applications/components/resource-details/resource-details.tsx:29-37](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx#L29-L37), [server/application/terminal.go:94-159](https://github.com/argoproj/argo-cd/blob/main/server/application/terminal.go#L94-L159)

## Application Details View Integration

### Overview

The `ApplicationDetails` React component serves as the core orchestration hub for Argo CD's application inspection and management view. It coordinates application state streaming, resource tree watches, and user interface view preferences by subscribing to multiple concurrent RxJS observables and routing URL search parameters. When an application route is loaded, `loadAppInfo` combines initial REST fetches with real-time WebSocket streams for both application changes and resource tree updates, ensuring the UI remains synchronized with cluster state changes.

Sources: [ui/src/app/applications/components/application-details/application-details.tsx:84-124](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx#L84-L124), [ui/src/app/applications/components/application-details/application-details.tsx:1475-1528](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx#L1475-L1528)

### Call-Chain Execution Walkthrough

The loading and streaming execution path for application details proceeds through a structured sequence of reactive operations and asynchronous service calls:

1. `render()` calls the outer `DataLoader` component with `props.match.params.name`.
2. `load` passes name and namespace into `loadAppInfo(name, appNamespace)`, which queries `services.applications.get()` to retrieve the initial application model.
3. `mergeMap` constructs a fallback resource tree from resource statuses and combines three concurrent observable streams via `combineLatest`:
   - `merge(from([app]), appChanged, AppUtils.handlePageVisibility(services.applications.watch(...)))`: Streams application mutations, manual refreshes, and server-sent watch events (triggering `onAppDeleted()` if a `DELETED` watch event arrives).
   - `merge(from([fallbackTree]), services.applications.resourceTree(...), AppUtils.handlePageVisibility(services.applications.watchResourceTree(...)))`: Streams static tree resolution and live resource tree updates.
4. `filter(([application, tree]) => !!application && !!tree)` guarantees both entities exist before passing them downstream.
5. `map` returns the final `{application, tree}` payload to populate UI panels and the resource graph.

Sources: [ui/src/app/applications/components/application-details/application-details.tsx:622-665](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx#L622-L665), [ui/src/app/applications/components/application-details/application-details.tsx:1475-1528](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx#L1475-L1528)

### View Preferences and URL Synchronization

The component synchronizes UI view preferences and query parameters in real time. Users can toggle between multiple visualization modes, filter resources by wildcards, and control node expansion states.

| View Key | Constant Name | Description |
| :--- | :--- | :--- |
| `tree` | `AppsDetailsViewKey.Tree` | Hierarchical resource graph mapping parent-child relationships and sync waves. |
| `network` | `AppsDetailsViewKey.Network` | Networking hierarchy view highlighting traffic flows and ingress/service links. |
| `pods` | `AppsDetailsViewKey.Pods` | Pod-centric group view displaying container status metrics and sorting modes. |
| `list` | `AppsDetailsViewKey.List` | Paginated tabular resource list with filtering and batch operations. |

Sources: [ui/src/app/applications/components/application-details/application-details.tsx:13-14](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx#L13-L14), [ui/src/app/applications/components/application-details/application-details.tsx:308-325](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx#L308-L325)

> [!NOTE]
> When an application defines a default view annotation (`argocd.argoproj.io/default-view`), the component overrides the global user preference on initial load unless an explicit `view` query parameter is present in the URL.

Sources: [ui/src/app/applications/components/application-details/application-details.tsx:638-647](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx#L638-L647)

> [!WARNING]
> Deleting an application while `requiresDeletionConfirmation` is active requires explicit pruning confirmation via `confirmDeletion()`. Bypassing this check without acknowledging resource deletion prompts can leave orphan cluster resources in unexpected states.

Sources: [ui/src/app/applications/components/application-details/application-details.tsx:1384-1392](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx#L1384-L1392), [ui/src/app/applications/components/application-details/application-details.tsx:1407-1414](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-details.tsx#L1407-L1414)

## Dynamic Resource Tree Rendering

### Overview

The `ApplicationResourceTree` component builds and renders interactive DAG layouts for Kubernetes resource topologies. It constructs node graphs using Dagre, handles recursive parent-child and networking hierarchy traversal, manages node filtering and collapsing, and draws connection edges with animated gradients.

Sources: [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:1003-1363](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L1003-L1363)

### Graph Construction and Layout Walkthrough

When rendering resource hierarchies, `ApplicationResourceTree` executes a deterministic graph setup and layout sequence:

1. Instantiates a `dagre.graphlib.Graph` object configured with layout defaults (`nodesep: 25`, `rankdir: 'LR'`, `marginy: 45`, `marginx: -100`, `ranksep: 80`).
2. Constructs root nodes for the application (`appNode`) and optional parent application sets (`appSetNode`), mapping sync and health status models.
3. Populates `nodeByKey` by merging managed resources and optional orphaned nodes (`props.tree.orphanedNodes`), updating health and hook statuses from `statusByKey`.
4. Evaluates `props.useNetworkingHierarchy` to branch between networking layout logic (`findNetworkTargets`, ingress/service routing) and standard parent-child tree layout.
5. Recursively traverses child nodes via `processNode()` or network paths, registering nodes and directed edges on the Dagre graph while respecting node expansion states.
6. Invokes `dagre.layout(graph)` to compute exact `(x, y)` coordinates and bounding box dimensions (`getGraphSize()`).
7. Iterates over graph edges to calculate routing lines, line offsets, gradient backgrounds, and arrow connectors for rendering.

Sources: [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:1003-1380](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L1003-L1380), [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:1428-1549](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L1428-L1549)

### Resource Node Types and Constants

| Constant Name | Value / Identifier | Purpose |
| :--- | :--- | :--- |
| `NODE_WIDTH` | `282` | Standard rendering width for resource tree nodes in pixels. |
| `NODE_HEIGHT` | `52` | Standard rendering height for resource tree nodes in pixels. |
| `POD_NODE_HEIGHT` | `136` | Base height for pod group nodes before accounting for row counts. |
| `POD_GROUP_ROW_HEIGHT` | `20` | Row height increment for grouped pod views. |
| `POD_GROUP_PODS_PER_ROW` | `8` | Maximum number of pod icons rendered per row in compact pod groups. |
| `FILTERED_INDICATOR_NODE` | `__filtered_indicator__` | Graph node identifier used when resource nodes are hidden by active filters. |
| `EXTERNAL_TRAFFIC_NODE` | `__external_traffic__` | Anchor node representing external ingress traffic sources in network view. |
| `INTERNAL_TRAFFIC_NODE` | `__internal_traffic__` | Anchor node representing internal cluster traffic in network view. |

Sources: [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:91-99](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L91-L99)

> [!NOTE]
> When rendering Gateway API routes (`HTTPRoute`, `GRPCRoute`, `TCPRoute`, `TLSRoute`, `UDPRoute`) connected to a `Gateway`, `shouldReverseEdge()` automatically inverts parent-child directionality so that the `Gateway` acts as the source parent, correctly mapping traffic flow from ingress to route.

Sources: [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:1156-1159](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L1156-L1159), [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:1166-1170](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L1166-L1170)

### Graph Filtering and Grouping Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Dagre auto-layout integration** | Automatically calculates non-overlapping `(x, y)` coordinates for complex hierarchical graphs without manual positioning logic. | External layout engine overhead during large tree updates and streaming state re-renders. |
| **Filtered indicator collapsing (`filterGraph`)** | Keeps tree graphs clean by collapsing hidden filtered nodes into a single indicator node. | Removes intermediary nodes from the visual path, requiring edge reconnection across skipped parents and children. |
| **Sibling node aggregation (`groupNodes`)** | Reduces visual clutter by compacting homogeneous sibling nodes of the same kind into collapsible summary nodes. | Requires secondary click handlers (`onGroupdNodeClick`) to inspect individual collapsed child items. |
| **Traffic gradient mapping (`TRAFFIC_COLORS`)** | Distinguishes multiple concurrent ingress and service routes using deterministic color palettes. | Limited to predefined color darkness steps, which may repeat on highly dense multi-ingress networks. |

Sources: [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:109-214](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L109-L214), [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:1109-1363](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L1109-L1363)

> [!WARNING]
> Node dragging and panning rely on pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp`) attached to the outer graph container. Intercepting or stopping propagation on inner node targets without handling pointer states correctly can lock scroll positioning or prevent drag interactions.

Sources: [ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx:1439-1482](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-resource-tree/application-resource-tree.tsx#L1439-L1482)

## Resource List and Sorting Navigation

### Overview

The resource list component renders tabular resource views with status mapping, column sorting, and managed resource navigation for Argo CD applications. It processes raw resource status collections and displays them within a clickable table layout (`argo-table-list argo-table-list--clickable`). 

Sources: [ui/src/app/applications/components/application-details/application-resource-list.tsx:74-190](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L74-L190), [ui/src/app/applications/components/application-details/application-resource-list.tsx:191-313](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L191-L313)

### Application Resource Parent Reference and Navigation

The component extracts parent-child relationship maps by scanning tree node collections via `nodeKey(res)` lookup maps. If all listed resources share the exact same parent node reference (`isSameParent`), it renders an `EditablePanel` detailing the parent node's kind, name, and namespace.

Sources: [ui/src/app/applications/components/application-details/application-resource-list.tsx:41-72](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L41-L72)

```typescript
export const ApplicationResourceParentRef = (props: ApplicationResourceParentRefProps) => {
    const nodeByKey = new Map<string, models.ResourceNode>();
    props.tree?.nodes?.forEach(res => nodeByKey.set(nodeKey(res), res));

    const firstParentNode = props.resources.length > 0 && (nodeByKey.get(nodeKey(props.resources[0])) as ResourceNode)?.parentRefs?.[0];
    const isSameParent = firstParentNode && props.resources?.every(x => (nodeByKey.get(nodeKey(x)) as ResourceNode)?.parentRefs?.every(p => isSameNode(p, firstParentNode)));

    if (!isSameParent) {
        return null;
    }

    return (
        <EditablePanel
            title='PARENT NODE'
            values={firstParentNode}
            items={[
                {
                    title: 'KIND',
                    view: firstParentNode.kind
                },
                {
                    title: 'NAME',
                    view: firstParentNode.name
                },
                {
                    title: 'NAMESPACE',
                    view: firstParentNode.namespace
                }
            ]}
        />
    );
};
```

Sources: [ui/src/app/applications/components/application-details/application-resource-list.tsx:41-72](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L41-L72)

### Sorting Configuration and Column Mapping

Column sorting is driven by local React state storing the active sort key and direction (`asc` or `desc`). The `handleSort` function toggles the sorting direction when clicking an already active column key or resets to ascending when switching columns.

Sources: [ui/src/app/applications/components/application-details/application-resource-list.tsx:78-87](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L78-L87)

| Sort Key | Comparison Logic | Fallback / Default Value |
| :--- | :--- | :--- |
| `name` | `a.name.localeCompare(b.name)` | Empty string comparison |
| `group-kind` | `groupKindA.localeCompare(groupKindB)` (`group/kind`) | Filter out empty groups |
| `syncOrder` | `(a.syncWave ?? 0) - (b.syncWave ?? 0)` | `0` for missing sync waves |
| `namespace` | `namespaceA.localeCompare(namespaceB)` | Empty string `''` |
| `createdAt` | `createdOrNodeKey(a).localeCompare(..., {numeric: true})` | Node creation timestamp or key |
| `status` | `HealthPriority` difference, falling back to `SyncPriority` difference | `'Unknown'` status |

Sources: [ui/src/app/applications/components/application-details/application-resource-list.tsx:110-154](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L110-L154)

> [!NOTE]
> When sorting by `status`, resources are prioritized first by health status via `HealthPriority[healthA] - HealthPriority[healthB]`. If health priorities are equal (`compare === 0`), the sort falls back to comparing synchronization states using `SyncPriority[syncA] - SyncPriority[syncB]`.

Sources: [ui/src/app/applications/components/application-details/application-resource-list.tsx:143-153](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L143-L153)

### Managed Resource URL Handling and External Links

When rendering resources of kind `Application`, the component checks for managed-by-url annotations via `getManagedByURLFromNode(node)`. If an invalid managed-by URL is detected (`!isValidManagedByURL(managedByURL)`), it displays a restricted warning indicator with a `not-allowed` cursor and descriptive tooltip text (`MANAGED_BY_URL_INVALID_TEXT`).

Sources: [ui/src/app/applications/components/application-details/application-resource-list.tsx:210-232](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L210-L232)

> [!WARNING]
> Clicking on external application links or dropdown menus inside resource table rows explicitly calls `e.stopPropagation()` to prevent triggering the parent row's `onClick` handler, which would otherwise navigate or invoke `props.onNodeClick(nodeKey(res))`.

Sources: [ui/src/app/applications/components/application-details/application-resource-list.tsx:199-199](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L199-L199), [ui/src/app/applications/components/application-details/application-resource-list.tsx:225-227](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L225-L227), [ui/src/app/applications/components/application-details/application-resource-list.tsx:239-239](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-details/application-resource-list.tsx#L239-L239)

## Pod View Grouping and Metrics

### Overview

The `PodView` component processes the application resource tree to build pod-centric groupings, sorting structures, and resource capacity metric displays. Depending on the configured view preferences (`sortMode`), pods are aggregated by node, parent resource, or top-level resource.

Sources: [ui/src/app/applications/components/application-pod-view/pod-view.tsx:28-56](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-pod-view/pod-view.tsx#L28-L56)

### Grouping and Tree Processing Workflow

The data transformation is orchestrated through `processTree()`, which inspects tree nodes and application status maps to construct `PodGroup` collections. 

The step-by-step execution flow runs as follows:

1. `processTree()` checks if the tree exists, returning an empty array if falsy.
2. If `sortMode` is set to `'node'`, `initNodes` (host records) are mapped into `groupRefs` entries with metadata including system info (`kernelVersion`, `operatingSystem`, `architecture`), host resource capacities (`resourcesInfo`), and host labels.
3. An `app.status.resources` lookup map is generated (`statusByKey`) using `nodeKey(res)`.
4. The function iterates over `tree.nodes` to register non-pod resource groups or attach parent-child relationships and health/sync statuses when `sortMode` is not `'node'`.
5. A second pass over `tree.nodes` filters for nodes where `rnode.kind === 'Pod'`, creating `Pod` objects and mapping their node placement from `rnode.info`.
6. Pods are sorted within each group using `localeCompare` with `{numeric: true}` on their node keys, and groups with zero pods are filtered out.

Sources: [ui/src/app/applications/components/application-pod-view/pod-view.tsx:303-437](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-pod-view/pod-view.tsx#L303-L437)

```typescript
export type PodGroupType = 'topLevelResource' | 'parentResource' | 'node';
export type SortOrder = 'asc' | 'desc';

export interface PodGroup extends Partial<ResourceNode> {
    timestamp?: number;
    type: PodGroupType;
    pods: Pod[];
    info?: InfoItem[];
    hostResourcesInfo?: HostResourceInfo[];
    resourceStatus?: Partial<ResourceStatus>;
    renderMenu?: () => ReactNode;
    renderQuickStarts?: () => ReactNode;
    fullName?: string;
    hostLabels?: {[name: string]: string};
}
```

Sources: [ui/src/app/applications/components/application-pod-view/pod-view.tsx:28-47](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-pod-view/pod-view.tsx#L28-L47)

### Grouping Modes and Preferences

Users can toggle grouping modes and age-based sorting using drop-down preferences stored via the services layer.

| Sort Mode Key | Display Label | Behavior / Grouping Strategy |
| :--- | :--- | :--- |
| `node` | `Node` | Groups pods directly by Kubernetes cluster node (`nodeName`). |
| `parentResource` | `Parent Resource` | Groups pods under their immediate parent resource (e.g., Deployment, StatefulSet). |
| `topLevelResource` | `Top Level Resource` | Walks up parent references recursively to group pods under root-level ancestors. |

Sources: [ui/src/app/applications/components/application-pod-view/pod-view.tsx:28-28](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-pod-view/pod-view.tsx#L28-L28), [ui/src/app/applications/components/application-pod-view/pod-view.tsx:439-443](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-pod-view/pod-view.tsx#L439-L443)

> [!NOTE]
> When `sortMode` is set to `'node'`, age-based sorting options are hidden. Instead, an `UNSCHEDULABLE` toggle button becomes available, allowing operators to filter out unschedulable nodes by updating `hideUnschedulable` in view preferences.

Sources: [ui/src/app/applications/components/application-pod-view/pod-view.tsx:85-113](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-pod-view/pod-view.tsx#L85-L113)

### Metric Calculation and Formatting

Host resource metrics (`HostResourceInfo`) such as CPU and memory requests are visualized using stacked percentage bars and interactive tooltips.

```typescript
const sizes = ['Bytes', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi'];
function formatSize(bytes: number) {
    if (!bytes) {
        return '0 Bytes';
    }
    const k = 1024;
    const dm = 2;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatMetric(name: ResourceName, val: number) {
    if (name === ResourceName.ResourceStorage || name === ResourceName.ResourceMemory) {
        // divide by 1000 to convert "milli bytes" to bytes
        return formatSize(val / 1000);
    }
    // cpu millicores
    return (val || '0') + 'm';
}
```

Sources: [ui/src/app/applications/components/application-pod-view/pod-view.tsx:445-463](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-pod-view/pod-view.tsx#L445-L463)

> [!WARNING]
> When formatting `ResourceMemory` or `ResourceStorage` metrics, the raw value is divided by `1000` to convert milli-bytes into standard bytes before passing it to `formatSize()`. CPU metrics append a trailing `'m'` indicator representing millicores.

Sources: [ui/src/app/applications/components/application-pod-view/pod-view.tsx:456-463](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/application-pod-view/pod-view.tsx#L456-L463)

## Resource Details and Inspection Panel

### Overview

The `ResourceDetails` component inspects selected Kubernetes resources and Argo CD applications. It fetches live cluster states, manages resource inspection tabs, calculates container group offsets for pods, and configures extension hooks.

Sources: [ui/src/app/applications/components/resource-details/resource-details.tsx:39-184](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx#L39-L184)

### Live Spec Fetching and State Resolution

When a node is selected, `DataLoader` queries managed resources, retrieves live cluster specs via `services.applications.getResource()`, and resolves associated events and RBAC permissions.

```typescript
const managedResources = await services.applications.managedResources(application.metadata.name, application.metadata.namespace, {
    id: {
        name: selectedNode.name,
        namespace: selectedNode.namespace,
        kind: selectedNode.kind,
        group: selectedNode.group
    }
});
const controlled = managedResources.find(item => AppUtils.isSameNode(selectedNode, item));
const summary = application.status.resources.find(item => AppUtils.isSameNode(selectedNode, item));
const controlledState = (controlled && summary && {summary, state: controlled}) || null;
const liveState = await services.applications.getResource(application.metadata.name, application.metadata.namespace, resQuery).catch((): null => null);
```

Sources: [ui/src/app/applications/components/resource-details/resource-details.tsx:267-283](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx#L267-L283)

> [!WARNING]
> If a resource fetch fails against the cluster API, `.catch((): null => null)` intercepts the error and returns `null`, preventing the inspection panel from crashing while rendering partial states.

Sources: [ui/src/app/applications/components/resource-details/resource-details.tsx:283-283](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx#L283-L283)

### Container Selection and Grouping

For `Pod` resources or nodes with underlying child pods, containers are parsed into `CONTAINERS` and `INIT CONTAINERS` groups with calculated offsets.

```typescript
const containerGroups = [
    {
        offset: 0,
        title: 'CONTAINERS',
        containers: podState.spec.containers || []
    }
];
if (podState.spec.initContainers?.length > 0) {
    containerGroups.push({
        offset: (podState.spec.containers || []).length,
        title: 'INIT CONTAINERS',
        containers: podState.spec.initContainers || []
    });
}
```

Sources: [ui/src/app/applications/components/resource-details/resource-details.tsx:93-106](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx#L93-L106)

Selecting a specific container updates the active container state index by combining the group offset and local index:

```typescript
const onClickContainer = (group: any, i: number, activeTab: string) => {
    const newIndex = group.offset + i;
    setActiveContainer(newIndex);
    SelectNode(selectedNodeKey, newIndex, activeTab, appContext);
};
```

Sources: [ui/src/app/applications/components/resource-details/resource-details.tsx:108-112](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx#L108-L112)

> [!NOTE]
> Active container indices automatically reset to `null` whenever `selectedNodeKey` changes between renders, by comparing `prevSelectedNodeKey` against `selectedNodeKey` during the render phase instead of relying on an asynchronous effect hook.

Sources: [ui/src/app/applications/components/resource-details/resource-details.tsx:47-53](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx#L47-L53)

### Resource Inspection Tabs

`getResourceTabs()` dynamically appends tabs based on the resource kind, live state availability, and RBAC permissions.

| Tab Key | Icon Class | Condition / Eligibility | Component Rendered |
| :--- | :--- | :--- | :--- |
| `summary` | `fa fa-file-alt` | Always present for valid nodes | `ApplicationNodeInfo` |
| `events` | `fa fa-calendar-alt` | `state` is present | `EventsList` |
| `logs` | `fa fa-align-left` | `podState` present & `logsAllowed` is true | `PodsLogsViewer` |
| `exec` | `fa fa-terminal` | `kind === 'Pod'`, `execEnabled`, and `execAllowed` | `PodTerminalViewer` |
| `preview` | None | `kind === 'ApplicationSet'` & group `'argoproj.io'` | `AppSetResourceNodePreview` |
| `extension-{i}` | Dynamic | Extension registered for resource group/kind | `tabExtensions.component` |

Sources: [ui/src/app/applications/components/resource-details/resource-details.tsx:80-181](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx#L80-L181), [ui/src/app/applications/components/resource-details/resource-details.tsx:359-373](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/applications/components/resource-details/resource-details.tsx#L359-L373)

## Pod Terminal Emulator and Execution

### Overview

The Argo CD backend handles terminal sessions through `terminalHandler` in `server/application/terminal.go`. Incoming requests pass through `WithFeatureFlagMiddleware`, which evaluates Argo CD settings via `getSettings()`. If `ExecEnabled` is false, the middleware immediately writes a `404 Not Found` status code. Otherwise, execution proceeds to `ServeHTTP()`, which parses and validates parameters from the request URL query string.

Sources: [server/application/terminal.go:32-92](https://github.com/argoproj/argo-cd/blob/main/server/application/terminal.go#L32-L92)

### WebSocket Terminal Handlers and Middleware

```go
func (s *terminalHandler) WithFeatureFlagMiddleware(getSettings GetSettingsFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		argocdSettings, err := getSettings()
		if err != nil {
			log.Errorf("error executing WithFeatureFlagMiddleware: error getting settings: %s", err)
			http.Error(w, "Failed to get settings", http.StatusBadRequest)
			return
		}
		if !argocdSettings.ExecEnabled {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		s.ServeHTTP(w, r)
	})
}
```

Sources: [server/application/terminal.go:76-92](https://github.com/argoproj/argo-cd/blob/main/server/application/terminal.go#L76-L92)

`ServeHTTP()` extracts query parameters (`pod`, `container`, `appName`, `projectName`, `namespace`, `appNamespace`, and `shell`) and performs strict validation using `argo` utility functions.

| Parameter | Validation Function | Failure Status |
| :--- | :--- | :--- |
| `pod` | `argo.IsValidPodName(podName)` | `400 Bad Request` |
| `container` | `argo.IsValidContainerName(container)` | `400 Bad Request` |
| `appName` | `argo.IsValidAppName(app)` | `400 Bad Request` |
| `projectName` | `argo.IsValidProjectName(project)` | `400 Bad Request` |
| `namespace` | `argo.IsValidNamespaceName(namespace)` | `400 Bad Request` |
| `appNamespace` | `argo.IsValidNamespaceName(appNamespace)` | `400 Bad Request` |

Sources: [server/application/terminal.go:95-133](https://github.com/argoproj/argo-cd/blob/main/server/application/terminal.go#L95-L133)

> [!WARNING]
> If any required parameter is missing or fails validation, `ServeHTTP()` aborts immediately with `400 Bad Request` before performing namespace checks or evaluating RBAC claims.

Sources: [server/application/terminal.go:103-134](https://github.com/argoproj/argo-cd/blob/main/server/application/terminal.go#L103-L134)

### Container Exec Authentication and Execution Call Chain

#### RBAC Permission Checks and Namespace Security

Once query parameters pass input validation, the handler checks namespace activation status and enforces role-based access control (RBAC) via the security package and enforcement engine.

```go
	ns := appNamespace
	if ns == "" {
		ns = s.namespace
	}

	if !security.IsNamespaceEnabled(ns, s.namespace, s.enabledNamespaces) {
		http.Error(w, security.NamespaceNotPermittedError(ns).Error(), http.StatusForbidden)
		return
	}

	ctx := r.Context()

	appRBACName := security.RBACName(s.namespace, project, appNamespace, app)
	if err := s.terminalOptions.Enf.EnforceErr(ctx.Value("claims"), rbac.ResourceApplications, rbac.ActionGet, appRBACName); err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	if err := s.terminalOptions.Enf.EnforceErr(ctx.Value("claims"), rbac.ResourceExec, rbac.ActionCreate, appRBACName); err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
```

Sources: [server/application/terminal.go:135-158](https://github.com/argoproj/argo-cd/blob/main/server/application/terminal.go#L135-L158)

#### Container Exec Call Chain

The execution pipeline retrieves cluster configuration, validates that the target pod belongs to the specified application via resource tree lookup, confirms that the container is currently running, and launches the interactive process.

```go
	a, err := s.appLister.Applications(ns).Get(app)
	if err != nil {
		if apierrors.IsNotFound(err) {
			http.Error(w, "App not found", http.StatusNotFound)
			return
		}
		fieldLog.Errorf("Error when getting app %q when launching a terminal: %s", app, err)
		http.Error(w, "Cannot get app", http.StatusInternalServerError)
		return
	}

	if a.Spec.Project != project {
		fieldLog.Warnf("The wrong project (%q) was specified for the app %q when launching a terminal", project, app)
		http.Error(w, "The wrong project was specified for the app", http.StatusBadRequest)
		return
	}

	config, err := s.getApplicationClusterRawConfig(ctx, a)
	if err != nil {
		http.Error(w, "Cannot get raw cluster config", http.StatusBadRequest)
		return
	}

	kubeClientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		http.Error(w, "Cannot initialize kubeclient", http.StatusBadRequest)
		return
	}

	resourceTree, err := s.appResourceTreeFn(ctx, a)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !podExists(resourceTree.Nodes, podName, namespace) {
		http.Error(w, "Pod doesn't belong to specified app", http.StatusBadRequest)
		return
	}
```

Sources: [server/application/terminal.go:165-204](https://github.com/argoproj/argo-cd/blob/main/server/application/terminal.go#L165-L204)

1. `ServeHTTP()` validates inputs, checks RBAC policies, and invokes `newTerminalSession()` to establish session handling.
2. `startProcess()` constructs the REST client POST request targeting `pods/{podName}/exec` with versioned `PodExecOptions` containing `Stdin`, `Stdout`, `Stderr`, and `TTY` flags.
3. `remotecommand.NewSPDYExecutor()` initializes the SPDY protocol executor as a base transport layer.
4. `remotecommand.NewWebSocketExecutor()` initializes the WebSocket executor (`GET` method per RFC 6455 Sec. 4.1) unless disabled by `cmdutil.RemoteCommandWebsockets`.
5. `remotecommand.NewFallbackExecutor()` wraps the WebSocket executor with SPDY fallback behavior using `httpstream.IsUpgradeFailure`.
6. `exec.StreamWithContext()` streams input, output, terminal sizing queues, and execution context through the

## Related

- [[UI Architecture]]
- [[Application API]]

