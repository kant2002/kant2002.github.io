---
layout: post
title:  "Migrating .NET Framework application"
date:   2025-08-18 21:41:44 +0500
categories: en dotnet
comments: true
---

Today I look at the chat, and seen person was excited that it convince manager to ditch VS 2015 in favor VS 2022 and have new modern .NET. Based on previous experience it think that it only should update version of .NET and maybe libraries and voilà it will be in the new and shiny world of .NET. Right from .NET 4.6.2 hell.

Let's say that's not true. I'm very cautious person, especially when updating legacy application and I think a lot of advices which suggest either rewrite or just update libraries and somehow deal with breakage, or go for one big bang update on the separate branch. That feeling make me sick. I cannot take that unnescessary risk, so I would try to suggest how one can safely, albeit slowly upgrade existing application.

Rewrite and YOLO upgrade maybe reasonably choice, but not usually when you on tight budget and lack of hands. If you feel that's for your, please listen to my advices. You don't have .NET super fast, but your will get to it safely on the cheap.

## Preparations for journey

I think if you want safely update existing application it would be long journey. You should be prepared to walk slowly. So as first start which everybody can do is take following steps

- Firstly just migrate your Nuget packages from packages.config to PackageReference. That make things a bit easier to version control and still suppported by "old" projects style.
- Secondly I would recommend just upgrade existing projects to new MSBuild SDK style. That immmidiately make your project more easier to understand and you get ediiting support in the Visual Studio. You will love your projects.
- Now I recommmend update your `LangVersion` to latest possible. You will have almost all latest C# features, while still being on .NET Framework runtime. I also love to use [PolySharp](https://github.com/Sergio0694/PolySharp) from Sergio Pedri to make even more C# features available in .NET Framework.

That's only preparation steps. You should make only one step at a time, and probably wait couple of releases, test runs until you confident that everything is settled and any bugs don't get introduced. There always possibility to get small issues if you have lot of projects, so don't rush. Second step also can make you couple surpises in your build scripts, or CI/CD infrastructure. Try to solve them, before you go forward. Take your time to understand why do you need change some MSbuild customizations. 

One example with MSBuild things, is that maybe you cannot use `SolutionDir` variable. But you can always create `Directory.Build.props` file where you add following

```msbuild
<Project>
    <PropertyGroup>
        <RepoRoot>$(MSBuildThisFileDirectory)</RepoRoot>
    </PropertyGroup>
</Project>
```

Now you can use `RepoRoot` instead of `SolutionDir` and don't rely on VS for building.

Oops, forget to mention. Don't upgrade MVC project, you should do something else with them instead. I will explain what exactly later.

## Know your pain points

Before upgrading, you should learn where your pain points can be. I would say, common offenders would be EF 6 and ASP.NET MVC and System.Web. That's parts which should be your primary concerns.

Right now, because you have modern infrastructure, you can start playing with building for multiple runtimes. For that you change in you project file

```xml
<TargetFramework>net462</TargetFramework>
```

to 
```xml
<TargetFramework>net462</TargetFramework>
<!-- <TargetFrameworks>net462;net8.0</TargetFrameworks> -->
```
Reason for commenting out building for multiple runtimes is becasue most likey your build would failed, and you don't ready jet for switch to new runtime. You will comment first line, uncommment second one and try, look at build issues and think a lot.

But what can simplify and scope your work. If you don't have already, abstract your entry point for MVC application in one WebApplication project, and all business logic, or code which don't depends on System.Web, and System.Web.Mvc should go into separate project. That project would be easier to migrate to supporting multiple runtime. Maybe you already have your application split by layers, and that would be a big help. I think you will have at least 3 projects (or project groups) after migrations

```
- CoreLogic
- WebLogic
- MvcWebApplication
```

`CoreLogic` is project where you don't have any dependency on System.Web/System.Web.Mvc and friends. That's most easy to upgrade things. 
`WebLogic` is project where you will move code which depends on the System.Web and System.Web.Mvc, it would be controllers, different kind of Web helpers which usually present in your code. You probably don't need to put some DI code here, let it live `MvcWebApplication`
`MvcWebApplication` is project where you keep your views, Global.asax, some OWIN code and initializations of whole system. That's only part which should be rewritten and thrown away. *Note: view would be copied over and modified, but that's another story*

Work diligently to move as much code as possible here. Maybe you need a bit of refactoring to have proper separations. Logic is following - `coreLogic` is relatively easy to upgrade, `WebLogic` is moderately risky to upgrade and `MvcWebApplication` is code which should be thrown away and written from scratch.

### EF upgrade

Now matter how you would like to have EF Core, don't jump onto it, you will lose your multi target abilities and that make your like more complicated then needed. Update EF6 to latest possible version at this time. It would be at least 6.5.1 as of Aug 2025. It support at least .NET 6 and that's enough to live in new world.

### Almost ready to start

Make sure that you be able build in multitarget configuration your `CoreLogic` project first. That require guessing right upmost version of your dependencies. Work on one dependency at at time, because lot of time passed, Google forget about small nuances which should be used for migration, they are not part of active index, so you should thread you path carefully. 

Sometimes dependencies act irresponsibly and drop .NET Framework support without having transition period of supporting both .NET Framework and .NET Core. In that case probably you should try create conditional dependency

Before: 
```xml
<ItemGroup>
    <PackageReference Include="ThirdParty" Version="2.0.0" />
</ItemGroup>
```

After:
```xml
<ItemGroup>
    <PackageReference Include="ThirdParty" Version="2.0.0" Condition="$(TargetFramework)=='net462'" />
    <PackageReference Include="ThirdParty" Version="3.0.0" Condition="$(TargetFramework)!='net462'" />
</ItemGroup>
```
Use it only if you need. Don't use that technique to move to latest third party version. It's too risky. Please don't. If you want wild right, go for big band rewrite and take responsibility for whole rewrite if you have guts to do that.

### ASP.NET MVC upgrade

That's most stupid part, but you probably have to do it. That's one of rare cases where `#if` would come handy.

```csharp
#if !NET462_OR_GREATER
    using Microsoft.AspNetCore.Mvc;
#else
    using System.Web.Mvc;
#endif
```

That would be almost enough to make code compile. You will still have issues with System.Web namespace, but I suggest hide then under some helper classes which you will massage with `#if` constructs.

If you have ASP.NET Indentity in some controllers, I have following snippets.

```csharp
#if !NET48
    using ApplicationSignInManager = Microsoft.AspNetCore.Identity.SignInManager<MyApp.ApplicationUser>;
    using SignInResult = Microsoft.AspNetCore.Identity.SignInResult;
#else
    using SignInResult = Microsoft.AspNet.Identity.Owin.SignInStatus;
#endif
```

and during usage I have to resort to `#if`s again.
```csharp
var isAdmin = await this.applicationUserManager.IsInRoleAsync(
#if !NET462_OR_GREATER
                user,
#else
                user.Id,
#endif
                "Administrator");
```

for logout I have following code
```csharp
#if !NET462_OR_GREATER
            await this.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
#else
            this.signInManager.AuthenticationManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie);
            await Task.CompletedTask;
#endif
```

also `ApplicationUser` maybe a bit customized
```csharp
    using System.Security.Claims;
    using System.Threading.Tasks;
#if !NET462_OR_GREATER
    using Microsoft.AspNetCore.Identity;
#else
    using Microsoft.AspNet.Identity;
#endif

    /// <summary>
    /// Application user.
    /// </summary>
    public class ApplicationUser
#if !NET462_OR_GREATER
        : IdentityUser<int>
#else
        : IUser<int>
#endif
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ApplicationUser"/> class.
        /// </summary>
        /// <param name="id">Id of the user to create.</param>
        public ApplicationUser(int id)
        {
            this.Id = id;
        }
#if NET462_OR_GREATER

        /// <summary>
        /// Gets id of the user.
        /// </summary>
        public int Id { get; private set; }

        /// <summary>
        /// Gets or sets unique name for the user.
        /// </summary>
        public string UserName { get; set; }

        /// <summary>
        /// Gets or sets hash of the user password.
        /// </summary>
        public string PasswordHash { get; set; }

        /// <summary>
        /// Gets or sets email of the user.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Generate claim identity from given user. Used by OWIN
        /// </summary>
        /// <param name="manager">User manager which use for generation of claims.</param>
        /// <returns>Task which return claims identity for current user.</returns>
        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<ApplicationUser, int> manager)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, DefaultAuthenticationTypes.ApplicationCookie);

            // Add custom user claims here
            return userIdentity;
        }
#endif
    }
```

In general lot of ASP.NET Identity stuff should be `#if` away as only for .NET 4.6.2 because it's different from ASP.NET Core Identity. Not a lot of things to retrofit here. Anyway do try make it.

Also if you use DI, and you probably should even in MVC application I also recommend create `IHttpContextAccessor`.

```csharp
namespace Microsoft.AspNetCore.Http;

#if NET462_OR_GREATER
using System.Web;

public interface IHttpContextAccessor
{
    HttpContext? HttpContext { get; }
}

public class HttpContextAccessor: IHttpContextAccessor
{
    public HttpContext? HttpContext => HttpContext.Current;
}

#endif
```

I think you get gist of my idea what you should do with this application. Make it build with multi-targeting setup. You will have bugs here guaranteed, but at least you find lot of problematic places where your logic would be changed during migration, and all of that would be catched by compiler. So you can think about these places.

Don't try to make it compile in multi-target way in one go, move slowly and careully. Firstly you need that you legacy application work flawlessly, that give you buy-in from management to continue moving this goal, since it's slow.

## Finishing touches

Now you should create new ASP.NET Core MVC application and put only initialization logic there, and copy `Views` folder from your `MvcWebApplication` application. It would immidiately start prodoce build errors, but all of them usually trivial and require you to use `await` a lot.

In case you have DI like AutoFac or other previously, keep using it in new application. Read about [ConfigureContainer](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.builder.configurehostbuilder.configurecontainer?view=aspnetcore-9.0) and [UseServiceProviderFactory](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.builder.configurehostbuilder.useserviceproviderfactory?view=aspnetcore-9.0)


If you have bundles in ASP.NET MVC, they are no more in ASP.NET Core MVC
```razor
@*@Styles.Render("~/bundles/jquery-ui/themes/base/css")
@Styles.Render("~/bundles/bootstrap/css")*@
```

Probably easier migration path would be to use [libman.json](https://learn.microsoft.com/en-us/aspnet/core/client-side/libman/libman-vs?view=aspnetcore-9.0)

## Migrate tests

After you migrate `CoreLogic` project, you should run multi-target tests for them. You definitely want to run tests over new configuration to sleep safely.

You probably cannot make nice tests over this web part. You should start over with test over this thing. If you use Playwright previously you may try to run test over new ASP.NET Core application. At least you will guess how hard your migration would go.

## The end!

Now you can run this application and start noticing issues and bugs. And here the hard work started. I cannot say what exactly you will experience, since it's largely depends on the application. I know, that migration is never easy, but up to this point you shake your application good enough, so you will better understand how to move forwad. Also you did safe work. Remember that green field rewrite is for these with unlimited budgets and stamina. I'm really too old (def. not lazy) for that.