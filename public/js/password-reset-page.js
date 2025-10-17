/**
 * Password Reset Page Handler
 * Handles the password reset confirmation flow when users click the link in their email
 * 
 * This script:
 * - Extracts the oobCode from URL parameters
 * - Validates that passwords match
 * - Calls Firebase Auth to confirm password reset
 * - Shows success/error messages
 * - Redirects to homepage on success
 */

(function() {
  'use strict';
  
  // Wait for DOM and auth to be ready
  function initPasswordResetPage() {
    const form = document.querySelector('[data-form="reset-password"]');
    const newPasswordInput = document.querySelector('[data-field="new-password"]');
    const confirmPasswordInput = document.querySelector('[data-field="confirm-password"]');
    const submitBtn = document.querySelector('[data-button="reset-password-submit"]');
    const errorContainer = document.querySelector('[data-reset-error]');
    const successContainer = document.querySelector('[data-reset-success]');
    
    // Get oobCode from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const oobCode = urlParams.get('oobCode');
    
    // Validate reset code exists
    if (!oobCode) {
      showError('Invalid or missing reset code. Please request a new password reset link.');
      if (form) {
        form.style.display = 'none';
      }
      console.error('❌ No oobCode found in URL');
      return;
    }
    
    console.log('✅ Password reset page initialized with valid code');
    
    // Handle form submission
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    } else {
      console.error('❌ Password reset form not found');
    }
  }
  
  /**
   * Handle form submission
   */
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const newPasswordInput = form.querySelector('[data-field="new-password"]');
    const confirmPasswordInput = form.querySelector('[data-field="confirm-password"]');
    const submitBtn = form.querySelector('[data-button="reset-password-submit"]');
    const errorContainer = form.querySelector('[data-reset-error]');
    const successContainer = form.querySelector('[data-reset-success]');
    
    const newPassword = newPasswordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;
    
    // Get oobCode from URL
    const urlParams = new URLSearchParams(window.location.search);
    const oobCode = urlParams.get('oobCode');
    
    // Clear previous messages
    hideMessage(errorContainer);
    hideMessage(successContainer);
    
    // Validate inputs
    if (!newPassword || !confirmPassword) {
      showError('Please enter and confirm your new password', errorContainer);
      return;
    }
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match', errorContainer);
      return;
    }
    
    // Show loading state
    setButtonLoading(submitBtn, true);
    
    try {
      // Wait for auth to be initialized
      if (!window.timBurtonAuth) {
        throw new Error('Authentication system not loaded');
      }
      
      // Confirm password reset via Firebase
      const result = await window.timBurtonAuth.confirmPasswordReset(oobCode, newPassword);
      
      if (result.success) {
        showSuccess('Password reset successful! Redirecting to home page...', successContainer);
        console.log('✅ Password reset successful');
        
        // Hide form
        if (form) {
          form.style.display = 'none';
        }
        
        // Redirect to homepage after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        
      } else {
        showError(result.error || 'Password reset failed. Please try again.', errorContainer);
        console.error('❌ Password reset failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Password reset error:', error);
      showError('An error occurred. Please try again or request a new reset link.', errorContainer);
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }
  
  /**
   * Show error message
   */
  function showError(message, container) {
    const errorContainer = container || document.querySelector('[data-reset-error]');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        hideMessage(errorContainer);
      }, 10000);
    } else {
      // Fallback to alert
      alert('Error: ' + message);
    }
  }
  
  /**
   * Show success message
   */
  function showSuccess(message, container) {
    const successContainer = container || document.querySelector('[data-reset-success]');
    if (successContainer) {
      successContainer.textContent = message;
      successContainer.style.display = 'block';
    } else {
      // Fallback to alert
      alert(message);
    }
  }
  
  /**
   * Hide message container
   */
  function hideMessage(container) {
    if (container) {
      container.style.display = 'none';
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
      button.innerHTML = '<span class="tb-spinner"></span> Resetting...';
      button.classList.add('tb-loading');
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || 'Reset Password';
      button.classList.remove('tb-loading');
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordResetPage);
  } else {
    initPasswordResetPage();
  }
  
})();

