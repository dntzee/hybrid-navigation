//
//  HBDViewController.m
//  NavigationHybrid
//
//  Created by Listen on 2017/11/25.
//  Copyright © 2018年 Listen. All rights reserved.
//

#import "HBDViewController.h"
#import "HBDUtils.h"
#import "HBDNavigationController.h"
#import <React/RCTLog.h>

@interface HBDViewController ()

@property(nonatomic, copy, readwrite) NSDictionary *props;
@property(nonatomic, strong, readwrite) HBDGarden *garden;

@end

@implementation HBDViewController

- (void)dealloc {
    RCTLogInfo(@"%s", __FUNCTION__);
}

- (instancetype)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    return [self initWithModuleName:nil props:nil options:nil];
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
    return [self initWithModuleName:nil props:nil options:nil];
}

- (instancetype)initWithModuleName:(NSString *)moduleName props:(NSDictionary *)props options:(NSDictionary *)options {
    if (self = [super initWithNibName:nil bundle:nil]) {
        _moduleName = moduleName;
        _options = options;
        _props = props;
        _garden = [[HBDGarden alloc] initWithViewController:self];
        
        [self applyNavigationBarOptions:options];
        [self applyTabBarOptions:options];
    }
    return self;
}

- (void)setAppProperties:(NSDictionary *)props {
    self.props = props;
}

- (UIStatusBarStyle)preferredStatusBarStyle {
    return self.hbd_barStyle == UIBarStyleBlack ? UIStatusBarStyleLightContent : UIStatusBarStyleDefault;
}

- (BOOL)prefersStatusBarHidden {
    if ([HBDUtils isIphoneX] || @available(iOS 13.0, *)) {
        return [self hbd_statusBarHidden] && ![HBDUtils hbd_inCall];
    } else {
        UIView *statusBar = [[UIApplication sharedApplication] valueForKey:@"statusBarWindow"];
        BOOL hidden = [self hbd_statusBarHidden] && ![HBDUtils hbd_inCall];
        CGFloat statusBarHeight = [UIApplication sharedApplication].statusBarFrame.size.height;
        statusBar.transform = hidden ? CGAffineTransformTranslate(CGAffineTransformIdentity, 0, -statusBarHeight) : CGAffineTransformIdentity;
        statusBar.alpha = hidden ? 0 : 1.0;
        return NO;
    }
}

- (void)viewDidLoad {
    [super viewDidLoad];
    NSString *screenColor = self.options[@"screenBackgroundColor"];
    if (screenColor) {
        self.view.backgroundColor = [HBDUtils colorWithHexString:screenColor];
    } else {
        self.view.backgroundColor = [HBDGarden globalStyle].screenBackgroundColor;
    }
}

- (void)applyTabBarOptions:(NSDictionary *)options {
    NSDictionary *tabItem = options[@"tabItem"];
    if (tabItem) {
        UITabBarItem *tabBarItem = [[UITabBarItem alloc] init];
        tabBarItem.title = tabItem[@"title"];
        NSDictionary *unselectedIcon = tabItem[@"unselectedIcon"];
        if (unselectedIcon) {
            tabBarItem.selectedImage = [[HBDUtils UIImage:tabItem[@"icon"]] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
            tabBarItem.image = [[HBDUtils UIImage:unselectedIcon] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
        } else {
            tabBarItem.image = [HBDUtils UIImage:tabItem[@"icon"]];
        }
        self.tabBarItem = tabBarItem;
    }
}

- (void)applyNavigationBarOptions:(NSDictionary *)options {
    NSString *topBarStyle = options[@"topBarStyle"];
    if (topBarStyle) {
        if ([topBarStyle isEqualToString:@"dark-content"]) {
            self.hbd_barStyle = UIBarStyleDefault;
        } else {
            self.hbd_barStyle = UIBarStyleBlack;
        }
    }
    
    NSString *topBarTintColor = options[@"topBarTintColor"];
    if (topBarTintColor) {
        self.hbd_tintColor = [HBDUtils colorWithHexString:topBarTintColor];
    }
    
    NSMutableDictionary *titleAttributes = [@{} mutableCopy];
    NSString *titleTextColor = [options objectForKey:@"titleTextColor"];
    NSNumber *titleTextSize = [options objectForKey:@"titleTextSize"];
    if (titleTextColor) {
        [titleAttributes setObject:[HBDUtils colorWithHexString:titleTextColor] forKey:NSForegroundColorAttributeName];
    }
    if (titleTextSize) {
        [titleAttributes setObject:[UIFont systemFontOfSize:[titleTextSize floatValue]] forKey:NSFontAttributeName];
    }
    
    if (titleAttributes.count > 0) {
        if (self.hbd_titleTextAttributes) {
            NSMutableDictionary *attributes = [self.hbd_titleTextAttributes mutableCopy];
            [attributes addEntriesFromDictionary:titleAttributes];
            self.hbd_titleTextAttributes = attributes;
        } else {
            self.hbd_titleTextAttributes = titleAttributes;
        }
    }
    
    NSString *topBarColor = options[@"topBarColor"];
    if (topBarColor) {
        self.hbd_barTintColor = [HBDUtils colorWithHexString:topBarColor];
    }
    
    NSNumber *topBarAlpha = options[@"topBarAlpha"];
    if (topBarAlpha) {
        self.hbd_barAlpha = [topBarAlpha floatValue];
    }
    
    NSNumber *topBarHidden = options[@"topBarHidden"];
    if ([topBarHidden boolValue]) {
        self.hbd_barHidden = YES;
    }
    
    if ([HBDGarden globalStyle].isBackTitleHidden) {
        self.navigationItem.backBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"" style:UIBarButtonItemStylePlain target:nil action:NULL];
    }
    
    NSDictionary *backItem = options[@"backItemIOS"];
    if (backItem) {
        NSString *title = backItem[@"title"];
        UIBarButtonItem *backButton = [[UIBarButtonItem alloc] init];
        backButton.title = title;
        NSString *tintColor = backItem[@"tintColor"];
        if (tintColor) {
            backButton.tintColor = [HBDUtils colorWithHexString:tintColor];
        }
        self.navigationItem.backBarButtonItem = backButton;
    }
    
    NSNumber *swipeBackEnabled = options[@"swipeBackEnabled"];
    if (swipeBackEnabled) {
        self.hbd_swipeBackEnabled = [swipeBackEnabled boolValue];
    }
    
    NSNumber *extendedLayoutIncludesTopBar = options[@"extendedLayoutIncludesTopBar"];
    if (extendedLayoutIncludesTopBar) {
        self.extendedLayoutIncludesOpaqueBars = [extendedLayoutIncludesTopBar boolValue];
    }
    
    NSNumber *hideShadow = options[@"topBarShadowHidden"];
    if (hideShadow) {
        self.hbd_barShadowHidden = [hideShadow boolValue];
    }
    
    NSNumber *statusBarHidden = options[@"statusBarHidden"];
    if (statusBarHidden) {
        self.hbd_statusBarHidden = [statusBarHidden boolValue];
    }
    
    NSNumber *backInteractive = options[@"backInteractive"];
    if (backInteractive) {
        self.hbd_backInteractive = [backInteractive boolValue];
    }
    
    NSNumber *backButtonHidden = options[@"backButtonHidden"];
    if (backButtonHidden) {
        if ([backButtonHidden boolValue]) {
            if (@available(iOS 11, *)) {
                [self.navigationItem setHidesBackButton:YES];
            } else {
                self.navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithCustomView:[UIView new]];
            }
        } else {
            if (@available(iOS 11, *)) {
                [self.navigationItem setHidesBackButton:NO];
            } else {
                self.navigationItem.leftBarButtonItem = nil;
            }
        }
    }
    
    NSDictionary *titleItem = options[@"titleItem"];
    if (titleItem) {
        NSString *moduleName = titleItem[@"moduleName"];
        if (!moduleName) {
            self.navigationItem.title = titleItem[@"title"];
        }
    }
    
    id rightBarButtonItem = options[@"rightBarButtonItem"];
    if (rightBarButtonItem) {
        [self.garden setRightBarButtonItem:RCTNilIfNull(rightBarButtonItem)];
    }
    
    id leftBarButtonItem = options[@"leftBarButtonItem"];
    if (leftBarButtonItem) {
        [self.garden setLeftBarButtonItem:RCTNilIfNull(leftBarButtonItem)];
    }
    
    NSArray *rightBarButtonItems = options[@"rightBarButtonItems"];
    if (rightBarButtonItems) {
        [self.garden setRightBarButtonItems:rightBarButtonItems];
    }
    
    NSArray *leftBarButtonItems = options[@"leftBarButtonItems"];
    if (leftBarButtonItems) {
        [self.garden setLeftBarButtonItems:leftBarButtonItems];
    }
}

- (void)updateNavigationBarOptions:(NSDictionary *)options {
    self.options = [HBDUtils mergeItem:options withTarget:self.options];
    
    NSMutableDictionary *target = [options mutableCopy];
    
    if (options[@"titleItem"]) {
        target[@"titleItem"] = self.options[@"titleItem"];
    }
    
    if (options[@"leftBarButtonItem"]) {
        target[@"leftBarButtonItem"] = self.options[@"leftBarButtonItem"];
    }
    
    if (options[@"rightBarButtonItem"]) {
        target[@"rightBarButtonItem"] = self.options[@"rightBarButtonItem"];
    }
    
    [self applyNavigationBarOptions:target];
    
    NSNumber *statusBarHidden = [options objectForKey:@"statusBarHidden"];
    if (statusBarHidden) {
        [self setNeedsStatusBarAppearanceUpdate];
    }
    
    NSNumber *passThroughTouches = [options objectForKey:@"passThroughTouches"];
    if (passThroughTouches) {
        [self.garden setPassThroughTouches:[passThroughTouches boolValue]];
    }
    
    [self hbd_setNeedsUpdateNavigationBar];
}

@end
