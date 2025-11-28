// Function to print all registered routes in a pretty format
export function printRoutes(app: Express.Application) {
  console.log("\n📋 Registered Routes:");
  console.log("─".repeat(60));

  const routeMap = new Map<string, string[]>();

  // Iterate through the router stack to collect routes (Express v5 compatible)
  const stack = (app as any)._router?.stack || (app as any).router?.stack || [];
  stack.forEach((middleware: any) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods)
        .filter((method) => middleware.route.methods[method])
        .map((method) => method.toUpperCase());

      const path = middleware.route.path;
      if (!routeMap.has(path)) {
        routeMap.set(path, []);
      }
      routeMap.get(path)!.push(...methods);
    } else if (middleware.name === "router") {
      // Routes from mounted routers (like better-auth)
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods)
            .filter((method) => handler.route.methods[method])
            .map((method) => method.toUpperCase());

          const path = handler.route.path;
          if (!routeMap.has(path)) {
            routeMap.set(path, []);
          }
          routeMap.get(path)!.push(...methods);
        }
      });
    }
  });

  // Remove duplicates from method arrays and sort
  for (const [path, methods] of routeMap) {
    const uniqueMethods = [...new Set(methods)].sort();
    routeMap.set(path, uniqueMethods);
  }

  // Sort routes by path for better readability
  const sortedRoutes = Array.from(routeMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Print routes with their methods
  sortedRoutes.forEach(([path, methods]) => {
    console.log(`${path}: [${methods.join(", ")}]`);
  });

  console.log("─".repeat(60));
  console.log(`Total routes: ${sortedRoutes.length}\n`);
}
