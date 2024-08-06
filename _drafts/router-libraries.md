---
layout: post
title:  "What is routing library?"
---

# What is routing library?

One of my friend ask me to give feedback on his routing library for Blazor, and after he present it, he ask me, what kind of feature I personally think would be good to have. I give him some advices which I think was common sense, but then I was struck with question, what features realy should be in the routing library for front-end?

I know that this is vague question, and different libraries obviously have different features. But, I previously seen [previous surveys](https://open-ui.org/) for Web, which was trying to capture current state, and find common ground.

So I decice that survey existing libraries is great thing to move forward, and I should do this survey. Preliminary questions from people around me seems to be support this, so let's move forward and do the survey. I intend to make this document living, in a sense that if you 
find library which is mature enough, and have interesting set of features, and want to place it in the list, you can submit PR. I also would like to see mature frameworks to appear on the list, and potentially routing for mobile devs, if that make sense.

## What is routing library?

I want to at least capture what I consider as routing library. Routing library is library which match URL of the final application to the UI component in the final application. I think this is bare minimum which is nescessary. All other properties would be descibed in more details later.

## Routing libraries in the survey

List of routing libraries which I look at in alphabetical order:

- [Angular](https://angular.dev/guide/routing)
- [Blazor](https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/routing)
- [Next](https://next-typesafe-url.dev/en/setup/defining-your-routes)
- [React Navigation](https://reactnavigation.org/)
- [Reach router](https://reach.tech/router/)
- [React Router](https://reactrouter.com/en/main)
- [router.js](https://github.com/tildeio/router.js/)
- [TanStack Router](https://tanstack.com/router/latest/docs/framework/react/guide/route-trees)
- [Vue Router](https://router.vuejs.org/)
- [Wouter](https://github.com/molefrog/wouter)

## Properties of the routing libraries

- Routes matching / parameters binding
- Routes nesting
- Multiple components match per route
- Single component match per route
- Named routes
- Redirect to other route
- Aliases
- Global Hooks
- Per-Route Hooks
- Typed links
- Navigation stack
- Programmatic navigation
- Authorization
- Deep linking
- Modal support
- 404 page
- Lazy loading
- Search parameters
- Parameter constraints
- Menu link matching based on route
- Multiple routers per application
- Catch-all parameters

### Routes nesting

Definition of routes can happens in tree fashion. We can define parent route which act as a prefix, and child routes which by itself can have their own children.

Rationale for such grouping is to define areas and sub-areas in large applications and let routes to have semantic meaning, so use can use browser address bar to navigate withing web-application.

### Multiple components match per route

This feature means that we can have more then one UI component matched for the final route. Usually that's comes for free with routes nesting, since parent route provide UI component and nested route also provide UI component, so we have more then one UI blocks controlled by routing. Usually that requires develop write parent UI component as some form of containers.

It is not impossible for me to imaging that we can have two route definitions which match same path, and provide 2 UI controls to display.

### Single component match per route

Contrary to multiple components match per route. It is desirable to prevent multiple UI components match for the route. So we want to stop nesting of the routes. 

### Named routes

When you have multple routes, and in large applications number of routes significant, it's easy to made a typo in the route when you want to refer to it, so it's desirable have name for the route. That name can be used when building navigation links, and when using for programmatic navigation between screens.

### Redirect to other route

Redirect from defined path, to another location within application. This should be done in declarative fashion, otherwise there [Programmatic navigation](#programmatic-navigation). You can think about this as aliases for existing pages.

### Global Hooks

Global hooks which allow be notified about routes match, or perform actions before and/or after navigation happens. You usually set them via API or as parameter to Router component.

### Per-Route Hooks

Same as global hooks, but for customization of transitions from/into the specific route. You can emulate these hooks if you have Global hooks support, but manually matching for the desired router. Obviously this is inconvinent if you need to apply customization to many routes.

### Typed links

For large application it is convinient for for any future refactoring, to be able to prodive typed wrappers for the links, or somehow check at compile time that configured navigation to the route is working.

## Properties availability

| Property                              | Angular            | Blazor             | Next               | React Navigation   | Reach router       | React Router       | router.js          | TanStack Router | Vue Router   | Wouter    | 
| --------                              | -------            | ------             | ----               | ----------------   | ------------       | ------------       | ---------          | --------------- | ---------- | ------ |
| Routes matching                       |                    |                    |                    |                    |                    |                    |                    |                 |  | | |
| Routes nesting                        | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Multiple components match per route   | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Single component match per route      |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: |           | :white_check_mark: |
| Named routes                          |                    |                    |                    | :white_check_mark: |                    |                    | :white_check_mark: |                 |:white_check_mark: |                    |
| Redirect to other route               | :white_check_mark: | :white_check_mark: |                    |                    |                    |                    |                    |                 | :white_check_mark: | :white_check_mark: |
| Global Hooks                          |                    | :white_check_mark: |                    | :white_check_mark: |                    | :white_check_mark: |                    |                 | :white_check_mark: | :white_check_mark: |
| Per-route Hooks                       |                    |                    |                    |                    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Typed links                           |                    |                    |                    | | | | | | | |
| Navigation stack                      | | | | | | | | | | |
| Programmatic navigation               | | | | | | | | | | |
| Authorization                         | | | | | | | | | | |
| Deep linking                          | | | | | | | | | | |
| Modal support                         | | | | | | | | | | |
| 404 page                              | | | | | | | | | | |
| Lazy loading                          | | | | | | | | | | |
| Search parameters                     | | | | | | | | | | |
| Parameter constraints                 | | | | | | | | | | |
| Catch-all parameters                  | | | | | | | | | | |

# Materials

- https://angular.dev/guide/routing/common-router-tasks#specifying-a-relative-route
- https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/routing?view=aspnetcore-8.0
- https://next-typesafe-url.dev/en/setup/defining-your-routes
- https://reactnavigation.org/docs/navigation-events/
- https://reach.tech/router/api/useLocation
- https://reactrouter.com/en/main/hooks/use-params
- https://github.com/tildeio/router.js/
- https://tanstack.com/router/latest/docs/framework/react/examples/navigation-blocking
- https://router.vuejs.org/guide/advanced/transitions.html
- https://github.com/molefrog/wouter?tab=readme-ov-file#useroute-route-matching-and-parameters