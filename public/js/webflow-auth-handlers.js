/**
 * Webflow Authentication Event Handlers
 * This file contains all the JavaScript needed for Webflow integration
 * Add this as an external script to your Webflow project
 */

// Authentication Event Handlers
document.addEventListener('timBurtonAuth', (event) => {
  const { type, data, user, isSignedIn } = event.detail;
  
  console.log('Auth Event:', event.detail);
  
  switch (type) {
    case 'signIn':
    case 'signUp':
    case 'sessionRestored':
      // User is signed in
      showUserInfo(user);
      hideAuthModal();
      break;
      
    case 'signOut':
      // User signed out
      showSignInButton();
      hideUserInfo();
      break;
      
    case 'signInError':
    case 'signUpError':
      // Handle errors
      showAuthError(data.error);
      break;
      
    case 'passwordResetSent':
      showAuthSuccess('Password reset email sent!');
      break;
  }
});

// Show user info when signed in
function showUserInfo(user) {
  const userInfo = document.getElementById('user-info');
  const signInBtn = document.getElementById('sign-in-btn');
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  
  if (userInfo) userInfo.style.display = 'block';
  if (signInBtn) signInBtn.style.display = 'none';
  if (userAvatar) userAvatar.src = user.picture || '/default-avatar.png';
  if (userName) userName.textContent = user.name || user.email;
}

// Show sign in button when not signed in
function showSignInButton() {
  const userInfo = document.getElementById('user-info');
  const signInBtn = document.getElementById('sign-in-btn');
  
  if (userInfo) userInfo.style.display = 'none';
  if (signInBtn) signInBtn.style.display = 'block';
}

// Hide user info
function hideUserInfo() {
  const userInfo = document.getElementById('user-info');
  if (userInfo) userInfo.style.display = 'none';
}

// Show auth modal
function showAuthModal() {
  const authModal = document.getElementById('auth-modal');
  if (authModal) authModal.style.display = 'flex';
}

// Hide auth modal
function hideAuthModal() {
  const authModal = document.getElementById('auth-modal');
  if (authModal) authModal.style.display = 'none';
}

// Show auth error
function showAuthError(message) {
  // You can customize this to show errors in your UI
  // For now, using alert - you can replace with a custom notification system
  alert('Authentication Error: ' + message);
}

// Show auth success
function showAuthSuccess(message) {
  // You can customize this to show success messages in your UI
  // For now, using alert - you can replace with a custom notification system
  alert(message);
}

// Initialize all event listeners
function initializeAuthHandlers() {
  // Tab switching functionality
  const tabs = document.querySelectorAll('.auth-tab');
  const tabContents = document.querySelectorAll('.auth-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const targetContent = document.getElementById(targetTab + '-tab');
      if (targetContent) targetContent.classList.add('active');
    });
  });
  
  // Sign in button click
  const signInBtn = document.getElementById('sign-in-btn');
  if (signInBtn) {
    signInBtn.addEventListener('click', showAuthModal);
  }
  
  // Close modal
  const authClose = document.getElementById('auth-close');
  if (authClose) {
    authClose.addEventListener('click', hideAuthModal);
  }
  
  // Sign out button
  const signOutBtn = document.getElementById('sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      if (window.timBurtonAuth) {
        window.timBurtonAuth.signOut();
      }
    });
  }
  
  // Email sign-in form
  const emailSignInForm = document.getElementById('email-signin-form');
  if (emailSignInForm) {
    emailSignInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('signin-email').value;
      const password = document.getElementById('signin-password').value;
      const submitBtn = emailSignInForm.querySelector('button[type="submit"]');
      
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
        // Hide loading state
        setButtonLoading(submitBtn, false);
      }
    });
  }
  
  // Email sign-up form
  const emailSignUpForm = document.getElementById('email-signup-form');
  if (emailSignUpForm) {
    emailSignUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const submitBtn = emailSignUpForm.querySelector('button[type="submit"]');
      
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
        // Hide loading state
        setButtonLoading(submitBtn, false);
      }
    });
  }
  
  // Forgot password
  const forgotPassword = document.getElementById('forgot-password');
  if (forgotPassword) {
    forgotPassword.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const email = prompt('Enter your email address:');
      if (email && window.timBurtonAuth) {
        const result = await window.timBurtonAuth.resetPassword(email);
        if (!result.success) {
          showAuthError(result.error);
        }
      }
    });
  }
  
  // Initialize Google Sign-In buttons
  setTimeout(() => {
    if (window.timBurtonAuth) {
      const googleSignInBtn = document.getElementById('google-signin-button');
      const googleSignUpBtn = document.getElementById('google-signup-button');
      
      if (googleSignInBtn) {
        window.timBurtonAuth.renderGoogleSignInButton('google-signin-button');
      }
      if (googleSignUpBtn) {
        window.timBurtonAuth.renderGoogleSignInButton('google-signup-button');
      }
    }
  }, 1000);
}

// Set button loading state
function setButtonLoading(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = '<span class="spinner"></span> Loading...';
    button.classList.add('loading');
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Sign In';
    button.classList.remove('loading');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAuthHandlers);

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuthHandlers);
} else {
  initializeAuthHandlers();
}
