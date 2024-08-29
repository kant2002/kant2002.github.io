---
layout: page
title: 'What is routing library?'
permalink: /projects/router-libraries/
---

# What is routing library?

One of my friend asked me to give feedback on his routing library for Blazor, and after he presented it, I was questioned - what kind of feature I personally think would be good to have in a such project? I gave him some advice which I think was common sense, but then I was struck with question, what features really should be in the routing library for modern front-end?

I know that this is a vague question, and different libraries obviously have different features. But, I have seen [previous surveys](https://open-ui.org/) for Web, which were trying to capture the current state, and find a common ground.

So I decide that to make a summary on existing libraries is great thing to move forward, and I should do it. Preliminary questions from people around me seem to support this, so let's move forward and see the results. I intend to make this document a live thing, in a sense that if you find any library which is mature enough with an interesting set of features, and want to place it in the list - you can submit a PR. I also would like to see mature frameworks to appear on the list, and potentially routing for mobile devs, if that make sense.

Please also consider this article as a live document. If you think I misinterpret something, or you want to add one more library, or a feature, you can go to https://github.com/kant2002/kant2002.github.io and suggest changes.

## What is routing library?

I want to at least capture what I consider a `routing library`. Routing library is library which matches the URL to the UI component in the final application. I think this is bare minimum which is essential. All other properties would be described in more details later.

## Routing libraries in the survey

List of routing libraries which I looked at, in alphabetical order:

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

## Features of the routing libraries

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
- Path parameters
- Search parameters
- Parameter constraints
- Menu link matching based on route
- Multiple routers per application
- Catch-all parameters

### Routes nesting

Definition of routes can be done in tree fashion. We can define parent route which acts as a prefix, and child routes which by themselves can have their own children.

Rationale for such grouping is to define areas and sub-areas in large applications and let routes to have semantic meaning, so we can use browser address bar to navigate with in the web-application.

### Multiple components match per route

This feature means that we can have more then one UI component matched for the final route. Usually that's comes for free with routes nesting, since parent route provide UI component and nested route also provide UI component, so we have more then one UI block controlled by routing. Usually that requires to design parent UI component as some form of containers.

It is not impossible for me to imagine that we can have two route definitions which match same path, and provide 2 UI controls to display.

### Single component match per route

Contrary to multiple components match per route, it is desirable to prevent multiple UI components match for the route. So we want to stop nesting of the routes.

### Named routes

When you have multiple routes, and, furthermore, in large applications the number of routes is pretty significant, it's easy to make a typo in the route when you want to refer to it, so it's desirable have a unique name for the route. That name can be used when building navigation links, and when using for programmatic navigation between screens.

### Redirect to other route

Redirect from defined path, to another location within application. This should be done in declarative fashion, otherwise it's a case of [Programmatic navigation](#programmatic-navigation). You can think about this as aliases for existing pages.

### Global Hooks

Global hooks which allow us to be notified about routes matching and changing, or ti perform actions before and/or after navigation happens. You usually set them via API or as parameter to Router component.

### Per-Route Hooks

Same as global hooks, but for customization of transitions from/into the specific route. You can emulate these hooks if you have Global hooks support, but manually matching for the desired router. Obviously this is not convenient if you need to apply customization to many routes.

### Typed links

For large application it is convenient for any future refactoring, to be able to provide typed wrappers for the links, or somehow check at compile time that configured navigation to the route is working. That can save you a lot of time if you add new route and it starts clashing with an existing one. With manual links you may hit situation when due to drift, some links have become outdated. For large application it would be very cumbersome and error-prone to check all the links, and validate that nothing is broken.

### Navigation stacks

When you perform a navigation, sometimes you have navigation patterns which act like a navigation stack. That's your dialog windows, on mobile it's separate screens which allow you to return back, etc. You would argue that this is not a router, technically yes, but I do not see router as a simple thing which is just a concept of "route something to your page". That way we can even suppose that links generation should not be part of routing. Personally I view routers as navigation libraries, which provide range of navigation facilities to your application. What if I want to be able navigate to dialog box directly?

I would treat navigation stacks, as facilities which able to create rollback point in the navigation history.

### Programmatic navigation

That's for being able to trigger navigation process, not via user interaction like clicks, but rather via code.

### Authorization

Most applications want to hide certain routers behind authorization rules. That may include simply authenticated/not-authenticated rules, or something more complicated with `roles-authz` or even `claims-authz`. If router is part of a Web framework, and framework supports route protection from unauthorized access, via some other means, I consider this as fact that router support authorization.

### Deep linking

Ability of the routing framework to support deep links. Unfortunately only one library support this scenario out of the box.

### Modal support

Some routes may point to opened modal windows. For example you want to provide add and edit entity screens as modal dialogs, and make them navigatable directly via URL.

### 404 page

That's feature which provide catch-all page, in case if URL address does not match existing route.

### Lazy loading

For large applications it is beneficial to be able to not include all routes in the initial bundle and make them lazy-loaded in runtime.

### Path parameters

These are parameters which is passed inside `path` part of URL. These parameter values then can accessed by user application, and can be used to control what information to present. Some libraries make that these parameters are statically typed, which is extra nice thing in my opinion.

### Search parameters

When specify routes, occasionally you should define how parameters can be passed to query strings. These query string parameters should be parsed and presented in some structured fashion. Otherwise, you can always use `location` object yourself. That's defeat purpose.
That important for migration of older applications. I will consider that library support search parameters, if you can define them, and access these values via same object as regular route parameters.

### Parameter constraints

Each specified parameter usually have specific format and/or data type. I would like that routing library allow specify which datatype route parameter should accept, or at a minimum to allow manually validate these parameters, so the logic would be contained close enough to the route declaration.

## Features availability

| Property                            | Angular            | Blazor             | Next               | React Navigation   | Reach router       | React Router       | router.js          | TanStack Router    | Vue Router         | Wouter             |
| ----------------------------------- | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| Routes matching                     |                    |                    |                    |                    |                    |                    |                    |                    |                    |                    |
| Routes nesting                      | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Multiple components match per route | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Single component match per route    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: |                    | :white_check_mark: |
| Named routes                        |                    |                    |                    | :white_check_mark: |                    |                    | :white_check_mark: |                    | :white_check_mark: |                    |
| Redirect to other route             | :white_check_mark: | :white_check_mark: |                    |                    |                    |                    |                    |                    | :white_check_mark: | :white_check_mark: |
| Global Hooks                        |                    | :white_check_mark: |                    | :white_check_mark: |                    | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: |
| Per-route Hooks                     |                    |                    |                    |                    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Typed links                         |                    |                    | :white_check_mark: |                    |                    |                    |                    | :white_check_mark: | :white_check_mark: |                    |
| Navigation stack                    |                    | :white_check_mark: |                    | :white_check_mark: | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Programmatic navigation             |                    | :white_check_mark: |                    | :white_check_mark: | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Authorization                       | :white_check_mark: | :white_check_mark: |                    | :white_check_mark: |                    |                    |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Deep linking                        |                    |                    |                    | :white_check_mark: |                    |                    |                    |                    |                    |                    |
| Modal support                       |                    |                    |                    | :white_check_mark: |                    |                    |                    |                    |                    |                    |
| 404 page                            | :white_check_mark: | :white_check_mark: |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Lazy loading                        | :white_check_mark: |                    |                    |                    | :white_check_mark: |                    |                    | :white_check_mark: | :white_check_mark: |                    |
| Path parameters                     | :white_check_mark: | :white_check_mark: | :white_check_mark: |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Search parameters                   |                    | :white_check_mark: | :white_check_mark: |                    |                    |                    |                    | :white_check_mark: |                    |                    |
| Parameter constraints               | :white_check_mark: | :white_check_mark: | :white_check_mark: |                    |                    |                    |                    | :white_check_mark: |                    |                    |
| Catch-all parameters                | :white_check_mark: | :white_check_mark: | :white_check_mark: |                    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
