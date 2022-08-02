#import "HBDDrawerNavigator.h"

#import "HBDReactBridgeManager.h"

@implementation HBDDrawerNavigator

- (NSString *)name {
    return @"drawer";
}

- (NSArray<NSString *> *)supportActions {
    return @[@"toggleMenu", @"openMenu", @"closeMenu"];
}

- (UIViewController *)createViewControllerWithLayout:(NSDictionary *)layout {
    NSDictionary *drawer = layout[self.name];
    NSArray *children = drawer[@"children"];
    if (children.count == 2) {
        NSDictionary *content = children[0];
        NSDictionary *menu = children[1];

        UIViewController *contentVC = [[HBDReactBridgeManager get] viewControllerWithLayout:content];
        UIViewController *menuVC = [[HBDReactBridgeManager get] viewControllerWithLayout:menu];

        if (contentVC && menuVC) {
            HBDDrawerController *drawerController = [[HBDDrawerController alloc] initWithContentViewController:contentVC menuViewController:menuVC];
            NSDictionary *options = drawer[@"options"];
            if (options) {
                NSNumber *maxDrawerWidth = options[@"maxDrawerWidth"];
                if (maxDrawerWidth) {
                    [drawerController setMaxDrawerWidth:[maxDrawerWidth floatValue]];
                }

                NSNumber *minDrawerMargin = options[@"minDrawerMargin"];
                if (minDrawerMargin) {
                    [drawerController setMinDrawerMargin:[minDrawerMargin floatValue]];
                }

                NSNumber *menuInteractive = options[@"menuInteractive"];
                if (menuInteractive) {
                    drawerController.menuInteractive = [menuInteractive boolValue];
                }
            }
            return drawerController;
        }
    }
    return nil;
}

- (NSDictionary *)buildRouteGraphWithViewController:(UIViewController *)vc {
    if ([vc isKindOfClass:[HBDDrawerController class]]) {
        HBDDrawerController *drawer = (HBDDrawerController *) vc;
        NSDictionary *content = [[HBDReactBridgeManager get] buildRouteGraphWithViewController:drawer.contentController];
        NSDictionary *menu = [[HBDReactBridgeManager get] buildRouteGraphWithViewController:drawer.menuController];
        return @{
                @"layout": @"drawer",
                @"sceneId": vc.sceneId,
                @"children": @[content, menu],
                @"mode": [vc hbd_mode],
        };
    }
    return nil;
}

- (HBDViewController *)primaryViewControllerWithViewController:(UIViewController *)vc {
    if ([vc isKindOfClass:[HBDDrawerController class]]) {
        HBDDrawerController *drawer = (HBDDrawerController *) vc;
        if (drawer.isMenuOpened) {
            return [[HBDReactBridgeManager get] primaryViewControllerWithViewController:drawer.menuController];
        } else {
            return [[HBDReactBridgeManager get] primaryViewControllerWithViewController:drawer.contentController];
        }
    }
    return nil;
}

- (void)handleNavigationWithViewController:(UIViewController *)vc action:(NSString *)action extras:(NSDictionary *)extras resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    HBDDrawerController *drawer = [vc drawerController];
    if (!drawer) {
        resolve(@(NO));
        return;
    }

    if (!drawer.hbd_viewAppeared) {
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t) (0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            [self handleNavigationWithViewController:vc action:action extras:extras resolver:resolve rejecter:reject];
        });
        return;
    }

    if ([action isEqualToString:@"toggleMenu"]) {
        [drawer toggleMenu];
    } else if ([action isEqualToString:@"openMenu"]) {
        [drawer openMenu];
    } else if ([action isEqualToString:@"closeMenu"]) {
        [drawer closeMenu];
    }

    resolve(@(YES));
}

@end
