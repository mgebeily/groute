export type Route = {
  path: string;
  children?: Route[];
  canActivate?: (params: Params) => boolean;
  onActivate?: (params: Params) => boolean | null;
  outlet?: string,
  content?: string | HTMLElement;
};

export type Options = {
  root?: HTMLElement,
  basePath?: string,
  controlNavigation: true,
}
export type Routes = Route[];
export type Params = { [key:string]: string };
export type RouteMatch = { route: Route, params: Params, leftToMatch?: string[] }
export type PathMatch = RouteMatch[];

const routeMatched = (chunksToMatch: string[]) => (route: Route): RouteMatch | null => {
  const chunks = route.path.split(/\/+/).filter((chunk) => chunk);
  const params: any = {};

  for(let x = 0; x < chunks.length; x++) {
    const here = chunksToMatch.shift();
    const routeHere = chunks[x];

    if (routeHere.startsWith(":")) {
      params[routeHere.substring(1)] = here;
    } else if (routeHere !== here) {
      return null;
    }
  }

  return { route, params, leftToMatch: chunksToMatch };
}

const getMatchedRouteTree = (routes: Routes, path = location.pathname, basePath = ''): PathMatch[] => {
  const currentPath = path.replace(new RegExp(`^${basePath}`), '')
  const matchedPaths = routes.map(routeMatched(currentPath.split(/\/+/).filter((chunk) => chunk)))
    .filter((result) => !!result).map((route) => [route]);

  const terminalRoutes: PathMatch[] = [];

  while (matchedPaths.length > 0) {
    const currentPath = matchedPaths.shift();
    const { leftToMatch, route } = currentPath[currentPath.length - 1];

    // TODO: Does this work without the spread?
    const matchedChildren = (route.children || []).map(routeMatched([...leftToMatch])).filter((result) => !!result)
      .map((route) => currentPath.concat([route]));

    matchedPaths.push(...matchedChildren)

    if (leftToMatch.length === 0 && matchedChildren.length === 0) {
      terminalRoutes.push(currentPath)
    }
  }

  return terminalRoutes;
}

const onNavigate = (routes: Routes, path = location.pathname, root = document.body, basePath = '') => {
  const matchedRoutes = getMatchedRouteTree(routes, path, basePath);

  // TODO: Gussy this up
  let matchedPath = null;

  for(let x = 0; x < matchedRoutes.length; x++) {
    const path = matchedRoutes[x];
    const params = path.reduce((previous, current) => ({ ...previous, ...current }), {})

    if (path.every(({ route: { canActivate }}) => !canActivate || canActivate(params))) {
      matchedPath = path.map(({ leftToMatch, ...route }) => ({ ...route, params }));
      break;
    }
  }

  if (!matchedPath) {
    return;
  }

  // TODO: Gussy this up. Can it be null?
  let currentOutlet = root;
  for(let x = 0; x < matchedPath.length; x++) {
    const { route, params } = matchedPath[x];

    if (route.onActivate) {
      route.onActivate(params)
    }

    const content = route.content;

    if (content instanceof HTMLElement) {
      // TODO: Is this correct?
      currentOutlet.innerHTML = content.outerHTML;
    } else if (content) {
      currentOutlet.innerHTML = content
    }

    if (route.outlet) {
      currentOutlet = currentOutlet.querySelector(route.outlet)
    }
    // TODO: Warn if there is no match outlet
  }
}

export const navigate = (url?: string | URL) => {
  const event = new CustomEvent('groute:navigated', {
    detail: {
      to: url
    }
  })
  window.dispatchEvent(event)
}

export const interceptLinks = () => {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && !target.getAttribute("data-groute-skip")) {
      e.preventDefault()
      const to = target.getAttribute("href")
      history.pushState({}, '', to);
    }
  })
}

export const groute = (routes: Routes, options: Options = { root: document.body, basePath: '', controlNavigation: true }) => {
  const { root, basePath, controlNavigation } = options;
  if (controlNavigation) {
    const oldPushState = history.pushState;
    history.pushState = (data, unused, url) => {
      navigate(url);
      return oldPushState.apply(history, [data, unused, url]);
    };
    interceptLinks()
  }

  window.addEventListener('DOMContentLoaded', () => {
    onNavigate(routes, location.pathname, root, basePath);
  })
  window.addEventListener('popstate', () => {
    // TODO: Is location pathname right here?
    onNavigate(routes, location.pathname, root, basePath);
  })
  window.addEventListener('groute:navigated', (e) => {
    const event = e as CustomEvent;
    onNavigate(routes, event.detail.to, root, basePath);
  })
}
