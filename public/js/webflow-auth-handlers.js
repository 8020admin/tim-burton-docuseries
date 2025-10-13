/**
 * Webflow Authentication Event Handlers
 * ATTRIBUTE-BASED INTERACTIONS - No IDs or classes required
 * 
 * All interactions use data attributes for maximum flexibility with Webflow
 */

// ============================================================================
// AUTHENTICATION EVENT HANDLERS
// ============================================================================

document.addEventListener('timBurtonAuth', async (event) => {
  const { type, data, user, isSignedIn, hasPurchase } = event.detail;
  
  console.log('Auth Event:', event.detail);
  
  switch (type) {
    case 'signIn':
    case 'signUp':
    case 'sessionRestored':
      hideAuthModal();
      
      // Initialize continue watching if user has purchased
      if (isSignedIn && hasPurchase && user && window.contentManager) {
        try {
          await window.contentManager.initializeContinueWatching(user.uid);
        } catch (error) {
          console.error('Error initializing continue watching:', error);
        }
      } else if (window.contentManager && window.contentManager.hideHeroSkeleton) {
        // Remove skeleton if user has no purchase (so they see default content)
        window.contentManager.hideHeroSkeleton();
      }
      break;
      
    case 'signOut':
      // Remove skeleton on sign out
      if (window.contentManager && window.contentManager.hideHeroSkeleton) {
        window.contentManager.hideHeroSkeleton();
      }
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
    
    // Reset any loading buttons
    const loadingButtons = authModal.querySelectorAll('.tb-loading');
    loadingButtons.forEach(btn => {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || 'Submit';
      btn.classList.remove('tb-loading');
    });
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
  
  // Show/hide modal headings based on tab
  const signInHeading = document.querySelector('[data-modal-heading="signin"]');
  const signUpHeading = document.querySelector('[data-modal-heading="signup"]');
  
  if (signInHeading) {
    signInHeading.style.display = tabName === 'signin' ? 'block' : 'none';
  }
  if (signUpHeading) {
    signUpHeading.style.display = tabName === 'signup' ? 'block' : 'none';
  }
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
        // Only reset button on error
        setButtonLoading(submitBtn, false);
      }
      // On success, button will be reset when modal closes
    }
  } catch (error) {
    setButtonLoading(submitBtn, false);
  }
}

/**
 * Handle email sign-up form submission
 */
async function handleEmailSignUp(e) {
  e.preventDefault();
  
  const form = e.target;
  const firstName = form.querySelector('[data-field="name"]')?.value;
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
      const result = await window.timBurtonAuth.signUpWithEmail(email, password, firstName);
      if (!result.success) {
        showAuthError(result.error);
        // Only reset button on error
        setButtonLoading(submitBtn, false);
      }
      // On success, button will be reset when modal closes
    }
  } catch (error) {
    setButtonLoading(submitBtn, false);
  }
}

/**
 * Handle password reset - show modal instead of prompt
 */
function handlePasswordReset(e) {
  e.preventDefault();
  
  // Hide auth modal first
  const authModal = document.querySelector('[data-modal="auth"]');
  if (authModal) {
    authModal.style.display = 'none';
  }
  
  // Show password recovery modal
  const modal = document.querySelector('[data-modal="password-recovery"]');
  if (modal) {
    modal.style.display = 'flex';
    
    // Clear any previous messages
    const errorContainer = modal.querySelector('[data-auth-error]');
    const successContainer = modal.querySelector('[data-auth-success]');
    if (errorContainer) errorContainer.style.display = 'none';
    if (successContainer) successContainer.style.display = 'none';
    
    // Focus on email input
    const emailInput = modal.querySelector('[data-field="email"]');
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 100);
    }
  }
}

/**
 * Handle password recovery form submission
 */
async function handlePasswordRecoverySubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const emailInput = form.querySelector('[data-field="email"]');
  const submitBtn = form.querySelector('[data-button="submit"]');
  const errorContainer = form.querySelector('[data-auth-error]');
  const successContainer = form.querySelector('[data-auth-success]');
  
  if (!emailInput || !emailInput.value.trim()) {
    showAuthError('Please enter your email address.', errorContainer);
    return;
  }
  
  const email = emailInput.value.trim();
  
  // Show loading state
  setButtonLoading(submitBtn, true);
  
  // Clear previous messages
  if (errorContainer) errorContainer.style.display = 'none';
  if (successContainer) successContainer.style.display = 'none';
  
  try {
    if (window.timBurtonAuth) {
      const result = await window.timBurtonAuth.resetPassword(email);
      
      if (result.success) {
        showAuthSuccess('Password reset email sent! Check your inbox.', successContainer);
        // Clear the form
        emailInput.value = '';
      } else {
        showAuthError(result.error, errorContainer);
      }
    } else {
      showAuthError('Authentication system not available. Please try again.', errorContainer);
    }
  } catch (error) {
    console.error('Password reset error:', error);
    showAuthError('An error occurred. Please try again.', errorContainer);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ============================================================================
// UI FEEDBACK
// ============================================================================

/**
 * Show auth error message
 */
function showAuthError(message, container = null) {
  // Use provided container or find default one
  const errorContainer = container || document.querySelector('[data-auth-error]');
  
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
function showAuthSuccess(message, container = null) {
  // Use provided container or find default one
  const successContainer = container || document.querySelector('[data-auth-success]');
  
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
  
  // Password recovery form - data-form="password-recovery"
  const passwordRecoveryForm = document.querySelector('[data-form="password-recovery"]');
  if (passwordRecoveryForm) {
    passwordRecoveryForm.addEventListener('submit', handlePasswordRecoverySubmit);
  }
  
  // Back to sign-in button - data-action="back-to-signin"
  const backToSignInButtons = document.querySelectorAll('[data-action="back-to-signin"]');
  backToSignInButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      // Hide password recovery modal
      const passwordModal = document.querySelector('[data-modal="password-recovery"]');
      if (passwordModal) {
        passwordModal.style.display = 'none';
      }
      // Show auth modal on sign-in tab
      showAuthModal('signin');
    });
  });
  
  // Close modal buttons - use event delegation to handle both data-action="close-modal" and data-modal-action="close"
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-action="close-modal"], [data-modal-action="close"]')) {
      e.preventDefault();
      e.stopPropagation();
      
      // Find the closest modal and close it
      const modal = e.target.closest('[data-modal]');
      if (modal) {
        modal.style.display = 'none';
        
        // If closing password recovery modal, show auth modal
        if (modal.getAttribute('data-modal') === 'password-recovery') {
          showAuthModal('signin');
        }
      }
    }
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
  switchAuthTab,
  showPasswordRecoveryModal: () => {
    const modal = document.querySelector('[data-modal="password-recovery"]');
    if (modal) {
      modal.style.display = 'flex';
      // Focus on email input
      const emailInput = modal.querySelector('[data-field="email"]');
      if (emailInput) {
        setTimeout(() => emailInput.focus(), 100);
      }
    }
  },
  hidePasswordRecoveryModal: () => {
    const modal = document.querySelector('[data-modal="password-recovery"]');
    if (modal) {
      modal.style.display = 'none';
    }
  }
};
