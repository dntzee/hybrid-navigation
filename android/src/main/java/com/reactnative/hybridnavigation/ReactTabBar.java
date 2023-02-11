package com.reactnative.hybridnavigation;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.Nullable;

public class ReactTabBar extends FrameLayout {

    private Drawable shadow = new ColorDrawable(Color.parseColor("#EEEEEE"));
    private Drawable background = new ColorDrawable(Color.WHITE);

    private FrameLayout mReactHolder;
    private View mDivider;
    private boolean mSizeIndeterminate;
    private FrameLayout mBackgroundView;

    public ReactTabBar(Context context) {
        super(context);
        init();
    }

    public ReactTabBar(Context context, boolean sizeIndeterminate) {
        super(context);
        mSizeIndeterminate = sizeIndeterminate;
        init();
    }

    public ReactTabBar(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
        init();
    }

    public ReactTabBar(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    public ReactTabBar(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
        init();
    }

    private void init() {
        setLayoutParams(new ViewGroup.LayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)));
        LayoutInflater inflater = LayoutInflater.from(getContext());
        int layout = mSizeIndeterminate ? R.layout.nav_tab_bar_react_indeterminate : R.layout.nav_tab_bar_react;
        View parentView = inflater.inflate(layout, this, true);
        mBackgroundView = parentView.findViewById(R.id.bottom_navigation_bar_background);
        mBackgroundView.setBackground(background);
        mReactHolder = parentView.findViewById(R.id.bottom_navigation_bar_react_holder);
        mDivider = parentView.findViewById(R.id.bottom_navigation_bar_divider);
        mDivider.setBackground(shadow);
    }

    public void setShadow(@Nullable Drawable drawable) {
        shadow = drawable;
        if (mDivider != null) {
            mDivider.setBackground(drawable);
        }
    }

    @Override
    public void setPadding(int left, int top, int right, int bottom) {
        mBackgroundView.setPadding(left, top, right, bottom);
        if (mSizeIndeterminate) {
            mReactHolder.setPadding(left, top, right, bottom);
        }
    }

    public void setRootView(View rootView) {
        mReactHolder.addView(rootView);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        mReactHolder.removeAllViews();
    }

    public void setTabBarBackground(Drawable drawable) {
        background = drawable;
        if (mBackgroundView != null) {
            mBackgroundView.setBackground(drawable);
        }
    }
}
