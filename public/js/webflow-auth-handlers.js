/**
 * Webflow Authentication Event Handlers
 * ATTRIBUTE-BASED INTERACTIONS - No IDs or classes required
 * 
 * All interactions use data attributes for maximum flexibility with Webflow
 */

// ============================================================================
// AUTHENTICATION EVENT HANDLERS
// ============================================================================

document.addEventListener('timBurtonAuth', (event) => {
  const { type, data, user, isSignedIn } = event.detail;
  
  console.log('Auth Event:', event.detail);
  
  switch (type) {
    case 'signIn':
    case 'signUp':
    case 'sessionRestored':
      hideAuthModal();
      break;
      
    case 'signOut':
      // Handled by button-state-manager
      break;
      
    case 'signInError':
    case 'signUpError':
      showAuthError(data.error);
      break;
      
    case 'passwordResetSent':
      showAuthSuccess('Password reset email sent!');
      break;
  }
});

// ============================================================================
// MODAL MANAGEMENT (Attribute-based)
// ============================================================================

/**
 * Show auth modal
 * Targets any element with data-modal="auth"
 */
function showAuthModal(tab = 'signin') {
  const authModal = document.querySelector('[data-modal="auth"]');
  if (!authModal) return;
  
  authModal.style.display = 'flex';
  
  // Switch to specified tab
  switchAuthTab(tab);
  
  // Render Google Sign-In buttons when modal opens
  setTimeout(() => {
    if (window.timBurtonAuth) {
      const googleButtons = document.querySelectorAll('[data-google-signin]');
      googleButtons.forEach(btn => {
        // Clear any existing content first
        btn.innerHTML = '';
        // Render the button
        window.timBurtonAuth.renderGoogleSignInButton(btn);
      });
    }
  }, 100);
}

/**
 * Hide auth modal
 */
function hideAuthModal() {
  const authModal = document.querySelector('[data-modal="auth"]');
  if (authModal) {
    authModal.style.display = 'none';
  }
}

/**
 * Show purchase options modal
 */
function showPurchaseModal() {
  const modal = document.querySelector('[data-modal="purchase"]');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Hide purchase options modal
 */
function hidePurchaseModal() {
  const modal = document.querySelector('[data-modal="purchase"]');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ============================================================================
// TAB MANAGEMENT (Attribute-based)
// ============================================================================

/**
 * Switch auth modal tabs
 * @param {string} tabName - 'signin' or 'signup'
 */
function switchAuthTab(tabName) {
  // Get all tab buttons and contents
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const tabContents = document.querySelectorAll('[data-auth-tab-content]');
  
  // Remove active class from all
  tabs.forEach(t => t.classList.remove('tb-active'));
  tabContents.forEach(tc => tc.classList.remove('tb-active'));
  
  // Add active class to target tab and content
  const targetTab = document.querySelector(`[data-auth-tab="${tabName}"]`);
  const targetContent = document.querySelector(`[data-auth-tab-content="${tabName}"]`);
  
  if (targetTab) targetTab.classList.add('tb-active');
  if (targetContent) targetContent.classList.add('tb-active');
}

// ============================================================================
// FORM HANDLERS (Attribute-based)
// ============================================================================

/**
 * Handle email sign-in form submission
 */
async function handleEmailSignIn(e) {
  e.preventDefault();
  
  const form = e.target;
  const email = form.querySelector('[data-field="email"]')?.value;
  const password = form.querySelector('[data-field="password"]')?.value;
  const submitBtn = form.querySelector('[type="submit"]');
  
  if (!email || !password) {
    showAuthError('Please enter email and password');
    return;
  }
  
  // Show loading state
  setButtonLoading(submitBtn, true);
  
  try {
    if (window.timBurtonAuth) {
      const result = await window.timBurtonAuth.signInWithEmail(email, password);
      if (!result.success) {
        showAuthError(result.error);
      }
    }
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

/**
 * Handle email sign-up form submission
 */
async function handleEmailSignUp(e) {
  e.preventDefault();
  
  const form = e.target;
  const name = form.querySelector('[data-field="name"]')?.value;
  const email = form.querySelector('[data-field="email"]')?.value;
  const password = form.querySelector('[data-field="password"]')?.value;
  const submitBtn = form.querySelector('[type="submit"]');
  
  if (!email || !password) {
    showAuthError('Please enter email and password');
    return;
  }
  
  // Show loading state
  setButtonLoading(submitBtn, true);
  
  try {
    if (window.timBurtonAuth) {
      const result = await window.timBurtonAuth.signUpWithEmail(email, password, name);
      if (!result.success) {
        showAuthError(result.error);
      }
    }
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

/**
 * Handle password reset
 */
async function handlePasswordReset(e) {
  e.preventDefault();
  
  const email = prompt('Enter your email address:');
  if (!email) return;
  
  if (window.timBurtonAuth) {
    const result = await window.timBurtonAuth.resetPassword(email);
    if (result.success) {
      showAuthSuccess('Password reset email sent!');
    } else {
      showAuthError(result.error);
    }
  }
}

// ============================================================================
// UI FEEDBACK
// ============================================================================

/**
 * Show auth error message
 */
function showAuthError(message) {
  // Check for custom error container
  const errorContainer = document.querySelector('[data-auth-error]');
  
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  } else {
    // Fallback to alert
    alert('Authentication Error: ' + message);
  }
}

/**
 * Show auth success message
 */
function showAuthSuccess(message) {
  // Check for custom success container
  const successContainer = document.querySelector('[data-auth-success]');
  
  if (successContainer) {
    successContainer.textContent = message;
    successContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      successContainer.style.display = 'none';
    }, 5000);
  } else {
    // Fallback to alert
    alert(message);
  }
}

/**
 * Set button loading state
 */
function setButtonLoading(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = '<span class="tb-spinner"></span> Loading...';
    button.classList.add('tb-loading');
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Submit';
    button.classList.remove('tb-loading');
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeAuthHandlers() {
  // Tab switching - Listen for clicks on elements with data-auth-tab
  const tabs = document.querySelectorAll('[data-auth-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-auth-tab');
      switchAuthTab(tabName);
    });
  });
  
  // Modal close buttons - data-modal-action="close"
  const closeButtons = document.querySelectorAll('[data-modal-action="close"]');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalType = btn.closest('[data-modal]')?.getAttribute('data-modal');
      if (modalType === 'auth') {
        hideAuthModal();
      } else if (modalType === 'purchase') {
        hidePurchaseModal();
      }
    });
  });
  
  // Email sign-in form - data-form="signin"
  const signInForm = document.querySelector('[data-form="signin"]');
  if (signInForm) {
    signInForm.addEventListener('submit', handleEmailSignIn);
  }
  
  // Email sign-up form - data-form="signup"
  const signUpForm = document.querySelector('[data-form="signup"]');
  if (signUpForm) {
    signUpForm.addEventListener('submit', handleEmailSignUp);
  }
  
  // Forgot password link - data-action="reset-password"
  const forgotPasswordLinks = document.querySelectorAll('[data-action="reset-password"]');
  forgotPasswordLinks.forEach(link => {
    link.addEventListener('click', handlePasswordReset);
  });
  
  // Initialize Google Sign-In buttons - data-google-signin
  setTimeout(() => {
    if (window.timBurtonAuth) {
      const googleButtons = document.querySelectorAll('[data-google-signin]');
      googleButtons.forEach(btn => {
        const containerId = btn.getAttribute('data-google-signin');
        if (containerId) {
          window.timBurtonAuth.renderGoogleSignInButton(containerId);
        }
      });
    }
  }, 1000);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuthHandlers);
} else {
  initializeAuthHandlers();
}

// Export functions for use by other modules
window.webflowAuthHandlers = {
  showAuthModal,
  hideAuthModal,
  showPurchaseModal,
  hidePurchaseModal,
  switchAuthTab
};
