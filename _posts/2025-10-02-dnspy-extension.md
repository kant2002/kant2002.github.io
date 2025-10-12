---
layout: post
title:  "Create dnSpy extension"
date:   2025-10-02 15:57:44 +0500
categories: en dotnet
comments: true
---

I do love reverse engineering, for some strange reasons that starts with reversing .NET Reflector and never ends to this day. I was at [security minded meetup](https://sysconf.io/2025) at Almaty and speak with one of the speaker about possibility for MCP for deobfuscation in de4dot, and he propose that [dnSpyEx](https://github.com/dnSpyEx/dnSpy) would be better workflow, and he did try create plugin for it, but essentially give up on it for some reasons. Since I'm more of software developer then security analyst, that should be no problem for me, so let's try and document the process.

# Creating project

For creation of plugin, we need create Class Library. 

```shell
dotnet new classlibrary -o dnspyplugin
```

DnSpy comes in two flavours - .NET Framework one, and .NET one, so you need to choose what TFM you want to target. You should choose either `net48` or `net8.0-windows`. That largerly would depends on what version of dnSpy you download. I choose .NET, so I make sure that my project has `<TargetFramework>net8.0-windows</TargetFramework>` in the project file.

The plugins rely on the contract with dnSpy which declared in the `dnSpy.Contracts.DnSpy.dll`. You have to manually add reference to that file, since it's not available on Nuget.

```xml
<ItemGroup>
    <Reference Include="dnSpy.Contracts.DnSpy">
        <HintPath>full-path-to\local\dnspy\dnSpy.Contracts.DnSpy.dll</HintPath>
    </Reference>
</ItemGroup>
```

Obviously you can vendor this DLL, and place it in `lib` folder near your source code and check in. But that's sounds sooooo 2010. Not gonna back to this time. Pick your poison though.

Also discovery of the plugin files rely on convention, `dnSpy` look for `*.x.dll` files in the `bin` folder, so you should tweak you assembly name.

Add one more customization `<AssemblyName>dnspyplugin.x</AssemblyName>` to project file.

Since you want UI for your plugin, at least for configuration, you want WPF. Enable it please - `<UseWpf>true</UseWpf>`.

Plugin wiring rely on the MEF, so please add `<PackageReference Include="System.ComponentModel.Composition" Version="8.0.0" />` to list of your dependencies.

Now place this code to Class1.cs file which comes from template. I prefer have it renamed to `TheExtension.cs` for conventions.

```csharp
using System.Windows;

namespace dnspyplugin;

[ExportExtension]
public sealed class TheExtension : IExtension
{
    public void OnEvent(ExtensionEvent @event, object? obj)
    {
    }

    public ExtensionInfo ExtensionInfo =>
        new()
        {
            ShortDescription = "Your test plugin",
        };

    public IEnumerable<string> MergedResourceDictionaries { get; } = [];
}
```

That's it. Now you can build your project. Now go to your dnSpy installation, and create `extensions` folder. Place `dnspyplugin.x.dll` in that folder, and start `dnSpy`. Then go to `Help -> About`, you can see "Your test plugin" in the list of loaded extensions.

That's it for the initiation. 

## Create menu item

Let's create some interesting, the whole menu item which will appear on assembly. 

```csharp
using System.Windows;
using dnSpy.Contracts.Menus;

namespace dnspyplugin;

[ExportMenuItem(
    Header = "My Menu Header",
    Group = MenuConstants.GROUP_CTX_DOCUMENTS_TOKENS, Order = 11)]
public sealed class MyMenuItem: MenuItemBase
{
    public override void Execute(IMenuItemContext context) => 
        MessageBox.Show("Hello, this is useless menu.");
}
```

That's bare minimum for the menu. We specify class which inherited from `MenuItemBase`, mark it with `ExportMenuItem`, where we at least specify menu title using `Header` property, group where menu will appear. In our case `MenuConstants.GROUP_CTX_DOCUMENTS_TOKENS` is group menu items on the node in Assembly Viewer windows. 

If you want to have menu, for example in the main application menu, registration would be a bit different

```csharp
[ExportMenuItem(OwnerGuid = MenuConstants.APP_MENU_HELP_GUID, Header = "My Menu Header", Group = MenuConstants.GROUP_APP_MENU_HELP_LINKS, Order = 11)]
public sealed class MyAboutMenuItem: MenuItemBase
{
    public override void Execute(IMenuItemContext context) => 
        MessageBox.Show("Hello, this is useless menu.");
}
```

Notice `OwnerGuid` which specify main menu item inside which menu item appears. I do not have clear guidance how to guess which menu group I want place from the start. Only guessing and a bit of experimenting I guess can help.

## Tool content

If you want to add some additional tool panel, you should wrote a bit more code. Firstly you will wrote tool content provider which will inform dnSpy about content panes. And then actual tool pane implementation. Let's start from content provider

```csharp
using dnSpy.Contracts.ToolWindows;
using dnSpy.Contracts.ToolWindows.App;

// ...
[Export(typeof(IToolWindowContentProvider))]
public class MyToolWindowContentProvider : IToolWindowContentProvider {
    public MyToolWindowContent DocumentTreeViewWindowContent => analyzerToolWindowContent ??= new MyToolWindowContent();
    MyToolWindowContent? analyzerToolWindowContent;
    
    public IEnumerable<ToolWindowContentInfo> ContentInfos {
        get { yield return new ToolWindowContentInfo(
            MyToolWindowContent.THE_GUID, 
            AppToolWindowLocation.DefaultHorizontal, 
            AppToolWindowConstants.DEFAULT_CONTENT_ORDER_BOTTOM_ANALYZER, 
            isDefault: false); }
    }

    public ToolWindowContent? GetOrCreate(Guid guid) => guid == MyToolWindowContent.THE_GUID ? DocumentTreeViewWindowContent : null;
}
```

That's most simple implementation where we declare available content using `ToolWindowContentInfo` descriptor. Just global Guid identifying the specific tool window withing dnSpy. Technically you may have multiple contents returned here, for example as additional documentations. 

Second part is providing UI content for the specific Guid. It's implemented in the `GetOrCreate` method. We just laziely create instance of `MyToolWindowContent` here. And now let's look at how it is implemented.

```csharp
public sealed class MyToolWindowContent : ToolWindowContent {
    public static readonly Guid THE_GUID = new Guid("5827D693-A5DF-4D65-A1F8-ACF249508A96");

    public override IInputElement? FocusedElement => null;
    public override FrameworkElement? ZoomElement => _content;
    public override Guid Guid => THE_GUID;
    public override string Title => "My tool window";
    public override object? UIObject => _content;
    
    private FrameworkElement _content;

    public MyToolWindowContent()
    {
        _content = new Label() { Content = "My tool window content" };
    }
}
```

Your responsibility is implement `FocusedElement`, `ZoomElement`, `Guid`, `Title` and `UIObject` and that's it. Most interesting here is `UIObject` property which actually WPF content which would be displayed. I use label here, but you can use anything else.

I understand that this is bare minimum, but from that point, you can create your own interesting dnSpy plugin!