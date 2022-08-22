package com.reactnative.hybridnavigation;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.widget.FrameLayout;

public class ReactFrameLayout extends FrameLayout implements ReactRootViewHolder {
    protected static final String TAG = "Navigation";

    private HBDReactRootView mReactRootView;
    private VisibilityObserver mVisibilityObserver;

    public ReactFrameLayout(Context context) {
        super(context);
    }

    public ReactFrameLayout(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public ReactFrameLayout(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }
    
    public ReactFrameLayout(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
    }

    @Override
    public void onViewAdded(View child) {
        super.onViewAdded(child);
        if (child instanceof HBDReactRootView) {
            mReactRootView = (HBDReactRootView) child;
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        if (mReactRootView != null) {
            removeView(mReactRootView);
        }
    }

    @Override
    public void setVisibility(int visibility) {
        super.setVisibility(visibility);
        if (mVisibilityObserver != null) {
            mVisibilityObserver.inspectVisibility(visibility);
        }
    }

    @Override
    public void setVisibilityObserver(VisibilityObserver observer) {
        mVisibilityObserver = observer;
    }
}
