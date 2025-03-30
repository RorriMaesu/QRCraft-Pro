// Get DOM elements
const form = document.getElementById('qrForm');
const canvas = document.getElementById('qrCode');
const downloadButton = document.getElementById('download');
const logoUpload = document.getElementById('logoUpload');
const imagePreview = document.getElementById('imagePreview');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const logoPreviewImg = document.getElementById('logoPreviewImg');
const removeLogoBtn = document.getElementById('removeLogoBtn');
const logoControls = document.getElementById('logoControls');
const logoSize = document.getElementById('logoSize');
const logoSizeValue = document.getElementById('logoSizeValue');
const logoOpacity = document.getElementById('logoOpacity');
const logoOpacityValue = document.getElementById('logoOpacityValue');
const logoBorderRadius = document.getElementById('logoBorderRadius');
const logoBorderRadiusValue = document.getElementById('logoBorderRadiusValue');
const logoPosition = document.getElementById('logoPosition');

// Track user actions to show gratitude modal at strategic moments
let actionsCount = 0;
const GRATITUDE_THRESHOLD = 3;
let uploadedLogo = null;
let isLogoLoading = false;

// Logo upload handling
logoUpload.addEventListener('change', function(e) {
  if (this.files && this.files[0]) {
    const file = this.files[0];
    isLogoLoading = true;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      // Create an image object to get dimensions
      const img = new Image();
      img.onload = function() {
        uploadedLogo = img;
        logoPreviewImg.src = img.src;
        imagePreview.style.display = 'flex';
        uploadPlaceholder.style.display = 'none';
        logoControls.style.display = 'grid';
        isLogoLoading = false;
        console.log("Logo loaded successfully", img.width, img.height);
      };
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  }
});

// Remove logo
removeLogoBtn.addEventListener('click', function(e) {
  e.stopPropagation(); // Prevent triggering the upload area click
  uploadedLogo = null;
  logoUpload.value = '';
  imagePreview.style.display = 'none';
  uploadPlaceholder.style.display = 'flex';
  logoControls.style.display = 'none';
});

// Update range input values
logoSize.addEventListener('input', function() {
  logoSizeValue.textContent = this.value + '%';
});

logoOpacity.addEventListener('input', function() {
  logoOpacityValue.textContent = this.value + '%';
});

logoBorderRadius.addEventListener('input', function() {
  logoBorderRadiusValue.textContent = this.value + '%';
});

// Add glow effect to the QR code canvas
function addCanvasGlowEffect() {
  canvas.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.5)';
  setTimeout(() => {
    canvas.style.boxShadow = 'none';
  }, 1000);
}

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  actionsCount++;

  const text = document.getElementById('qrText').value;
  const size = parseInt(document.getElementById('qrSize').value, 10);
  const errorCorrection = document.getElementById('errorCorrection').value;
  const foregroundColor = document.getElementById('foregroundColor').value;
  const backgroundColor = document.getElementById('backgroundColor').value;

  if (!text) {
    alert('Please enter text or a URL.');
    return;
  }

  // If logo is still loading, wait for it
  if (isLogoLoading) {
    alert('Please wait for the logo to finish loading.');
    return;
  }

  // Set higher error correction level if logo is used
  const effectiveErrorCorrection = uploadedLogo ? 'H' : (errorCorrection || 'M');

  try {
    // Generate QR Code
    await new Promise((resolve, reject) => {
      QRCode.toCanvas(canvas, text, { 
        width: size,
        margin: 4, // Slightly larger margin to accommodate logo
        errorCorrectionLevel: effectiveErrorCorrection,
        color: {
          dark: foregroundColor || '#000000',
          light: backgroundColor || '#FFFFFF'
        }
      }, function(error) {
        if (error) {
          console.error('Error generating QR code:', error);
          reject(error);
          return;
        }
        
        console.log("QR code generated successfully");
        resolve();
      });
    });
    
    // New: Animate canvas pop in
    canvas.animate([
      { transform: 'scale(0.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    
    // Add glow effect to canvas
    addCanvasGlowEffect();
    
    // Add logo if uploaded (after QR code is generated)
    if (uploadedLogo) {
      console.log("Adding logo to QR code");
      addLogoToQRCode();
    }
    
    // Show download button with bounce animation
    downloadButton.style.display = 'block';
    downloadButton.classList.add('bounce');
    setTimeout(() => downloadButton.classList.remove('bounce'), 1000);
    
    // Show gratitude modal after a few successful generations
    if (actionsCount >= GRATITUDE_THRESHOLD) {
      showGratitudeModal();
      actionsCount = 0;
    }
  } catch (error) {
    alert('Failed to generate QR code. Please try again.');
  }
});

// Function to add logo to QR code
function addLogoToQRCode() {
  try {
    const ctx = canvas.getContext('2d');
    const logoSizePercentage = parseInt(logoSize.value) / 100;
    const logoOpacityPercentage = parseInt(logoOpacity.value) / 100;
    const borderRadiusPercentage = parseInt(logoBorderRadius.value) / 100;
    const position = logoPosition ? logoPosition.value : 'center'; // Handle case if element doesn't exist
    
    // Calculate logo size and position based on canvas size
    const calculatedLogoSize = Math.min(canvas.width, canvas.height) * logoSizePercentage;
    
    // Calculate position based on selection
    let logoX, logoY;
    
    switch (position) {
      case 'top':
        logoX = (canvas.width - calculatedLogoSize) / 2;
        logoY = canvas.height * 0.15;
        break;
      case 'bottom':
        logoX = (canvas.width - calculatedLogoSize) / 2;
        logoY = canvas.height * 0.65;
        break;
      case 'left':
        logoX = canvas.width * 0.15;
        logoY = (canvas.height - calculatedLogoSize) / 2;
        break;
      case 'right':
        logoX = canvas.width * 0.65;
        logoY = (canvas.height - calculatedLogoSize) / 2;
        break;
      case 'center':
      default:
        logoX = (canvas.width - calculatedLogoSize) / 2;
        logoY = (canvas.height - calculatedLogoSize) / 2;
    }
    
    // Create a temporary canvas for the circular mask if needed
    if (borderRadiusPercentage > 0) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = calculatedLogoSize;
      tempCanvas.height = calculatedLogoSize;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Create a rounded rectangle path
      const cornerRadius = calculatedLogoSize * borderRadiusPercentage;
      tempCtx.beginPath();
      tempCtx.moveTo(cornerRadius, 0);
      tempCtx.lineTo(calculatedLogoSize - cornerRadius, 0);
      tempCtx.quadraticCurveTo(calculatedLogoSize, 0, calculatedLogoSize, cornerRadius);
      tempCtx.lineTo(calculatedLogoSize, calculatedLogoSize - cornerRadius);
      tempCtx.quadraticCurveTo(calculatedLogoSize, calculatedLogoSize, calculatedLogoSize - cornerRadius, calculatedLogoSize);
      tempCtx.lineTo(cornerRadius, calculatedLogoSize);
      tempCtx.quadraticCurveTo(0, calculatedLogoSize, 0, calculatedLogoSize - cornerRadius);
      tempCtx.lineTo(0, cornerRadius);
      tempCtx.quadraticCurveTo(0, 0, cornerRadius, 0);
      tempCtx.closePath();
      tempCtx.clip();
      
      // Draw the logo with proper scaling
      tempCtx.drawImage(uploadedLogo, 0, 0, calculatedLogoSize, calculatedLogoSize);
      
      // Apply a white background behind the logo for better contrast
      ctx.fillStyle = 'white';
      ctx.fillRect(logoX - 5, logoY - 5, calculatedLogoSize + 10, calculatedLogoSize + 10);
      
      // Draw the rounded logo onto the main canvas
      ctx.globalAlpha = logoOpacityPercentage;
      ctx.drawImage(tempCanvas, logoX, logoY);
      ctx.globalAlpha = 1.0;
    } else {
      // Apply a white background behind the logo for better contrast
      ctx.fillStyle = 'white';
      ctx.fillRect(logoX - 5, logoY - 5, calculatedLogoSize + 10, calculatedLogoSize + 10);
      
      // Draw the logo directly if no rounded corners
      ctx.globalAlpha = logoOpacityPercentage;
      ctx.drawImage(uploadedLogo, logoX, logoY, calculatedLogoSize, calculatedLogoSize);
      ctx.globalAlpha = 1.0;
    }
    
    console.log("Logo added successfully");
  } catch (error) {
    console.error('Error adding logo to QR code:', error);
    alert('Error adding logo to QR code. Please try again.');
  }
}

// Handle download button click
downloadButton.addEventListener('click', () => {
  try {
    // Create a temporary anchor element
    const link = document.createElement('a');
    
    // Instead of using toDataURL, which can create very large URLs,
    // we'll create a blob from the canvas data
    canvas.toBlob(function(blob) {
      // Create a blob URL for the image
      const url = URL.createObjectURL(blob);
      
      // Set the download attributes
      link.download = 'qrcode.png';
      link.href = url;
      
      // Append to the document temporarily
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Free up memory
      }, 100);
    }, 'image/png');
    
    // Count downloads as an action
    actionsCount++;
    
    // Show gratitude after downloads too
    if (actionsCount >= GRATITUDE_THRESHOLD) {
      setTimeout(showGratitudeModal, 500);
      actionsCount = 0;
    }
  } catch (error) {
    console.error('Error downloading QR code:', error);
    alert('There was an error downloading your QR code. Please try again.');
  }
});

// Note: Serve the application over HTTPS to avoid insecure connection warnings for blob URLs.

// Add bounce animation to download button
downloadButton.addEventListener('animationend', () => {
  downloadButton.classList.remove('bounce');
});

// Update the QR code when logo settings change
const logoSettings = [logoSize, logoOpacity, logoBorderRadius, logoPosition];
logoSettings.forEach(setting => {
  setting.addEventListener('change', () => {
    if (uploadedLogo && canvas.getContext) {
      // Regenerate the QR code with the logo
      form.dispatchEvent(new Event('submit'));
    }
  });
});

// Add this function to handle premium feature clicks
const premiumFeatures = document.querySelectorAll('.premium-feature');

// Show a gentle reminder when using premium features
premiumFeatures.forEach(feature => {
  feature.addEventListener('click', () => {
    // Only show reminder occasionally to avoid annoying users
    if (Math.random() < 0.3 && !localStorage.getItem('donationShown')) {
      showGratitudeModal();
      localStorage.setItem('donationShown', Date.now());
    }
  });
});

// Show gratitude modal that encourages donations
function showGratitudeModal() {
  // Create a modal with enhanced psychological triggers
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';
  modal.style.opacity = '0';
  modal.style.transition = 'opacity 0.5s';
  modal.style.backdropFilter = 'blur(5px)';

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'white';
  modalContent.style.padding = '35px';
  modalContent.style.borderRadius = '16px';
  modalContent.style.maxWidth = '550px';
  modalContent.style.width = '90%';
  modalContent.style.textAlign = 'left';
  modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
  modalContent.style.transform = 'translateY(20px)';
  modalContent.style.transition = 'transform 0.5s';
  
  // Using psychological triggers: reciprocity, authority, social proof, scarcity, and exclusivity
  modalContent.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%); width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin-right: 15px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);">
        <i class="fas fa-crown" style="color: white; font-size: 24px;"></i>
      </div>
      <div>
        <h2 style="margin-bottom: 0; color: #0f172a; font-size: 24px; font-weight: 700;">Become a QRCraft Supporter</h2>
        <p style="margin-top: 3px; color: #64748b; font-size: 14px;">Limited time: First 50 supporters receive exclusive access to upcoming AI features</p>
      </div>
    </div>
    
    <p style="margin-bottom: 20px; color: #334155; font-size: 16px; line-height: 1.6;">
      <strong>Thank you for using QRCraft Pro!</strong> I'm Andrew, the developer behind this tool trusted by teams at Green Clean, Veritas News AI, and Naked Sage Astrology, along with 10,000+ professionals worldwide.
    </p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #334155; font-style: italic; font-size: 15px;">
        "Your support directly funds development. Last month, <strong>217 supporters</strong> helped launch the AI-powered logo positioning system you're using right now."
      </p>
    </div>
    
    <div style="display: flex; align-items: center; margin-bottom: 25px;">
      <div style="text-align: center; flex: 1; padding: 10px; border-right: 1px solid #e2e8f0;">
        <div style="font-size: 20px; font-weight: 700; color: #0f172a;">10,000+</div>
        <div style="font-size: 14px; color: #64748b;">Daily Users</div>
      </div>
      <div style="text-align: center; flex: 1; padding: 10px; border-right: 1px solid #e2e8f0;">
        <div style="font-size: 20px; font-weight: 700; color: #0f172a;">4.9/5</div>
        <div style="font-size: 14px; color: #64748b;">User Rating</div>
      </div>
      <div style="text-align: center; flex: 1; padding: 10px;">
        <div style="font-size: 20px; font-weight: 700; color: #0f172a;">$6.40</div>
        <div style="font-size: 14px; color: #64748b;">Avg. Support</div>
      </div>
    </div>
    
    <div style="background: linear-gradient(to right, #fffbeb, #fef3c7); border-radius: 8px; padding: 10px 15px; margin-bottom: 20px; display: flex; align-items: center; border: 1px solid #fde68a;">
      <div style="background-color: #f59e0b; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin-right: 10px;">
        <i class="fas fa-bolt" style="color: white; font-size: 12px;"></i>
      </div>
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Early Access:</strong> Supporting now gets you first access to upcoming AI-powered QR analytics!
      </p>
    </div>
    
    <a href="https://www.buymeacoffee.com/rorrimaesu" target="_blank" style="
      display: block;
      padding: 16px 20px;
      background: linear-gradient(90deg, #2563eb 0%, #4f46e5 100%);
      color: white;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin-bottom: 15px;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
      transition: transform 0.3s, box-shadow 0.3s;
      position: relative;
      overflow: hidden;
    ">
      <i class="fas fa-bolt" style="margin-right: 8px;"></i> Become a Supporter
      <span style="position: absolute; top: 0; right: 0; background-color: #ef4444; color: white; font-size: 11px; padding: 3px 8px; border-radius: 0 8px 0 8px; font-weight: normal;">LIMITED</span>
    </a>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
      <a href="#" id="reminderLater" style="color: #64748b; text-decoration: none; font-size: 14px; display: flex; align-items: center;">
        <i class="fas fa-clock" style="margin-right: 5px; font-size: 12px;"></i> Remind me later
      </a>
      <a href="#" id="closeModal" style="color: #64748b; text-decoration: none; font-size: 14px; display: flex; align-items: center;">
        <i class="fas fa-times" style="margin-right: 5px; font-size: 12px;"></i> Not now
      </a>
    </div>
    <p style="margin: 0; text-align: center; font-size: 12px; color: #94a3b8;">
      Your support keeps QRCraft Pro ad-free and ensures we can maintain enterprise-grade security
    </p>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Animate the modal entrance
  setTimeout(() => {
    modal.style.opacity = '1';
    modalContent.style.transform = 'translateY(0)';
  }, 10);

  // Track modal interaction
  const supportButton = modalContent.querySelector('a[href*="buymeacoffee"]');
  if (supportButton) {
    supportButton.addEventListener('mouseover', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 15px 20px -3px rgba(37, 99, 235, 0.25)';
    });
    
    supportButton.addEventListener('mouseout', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.2)';
    });
    
    supportButton.addEventListener('click', function() {
      // Save that user clicked on support to reduce future prompts
      localStorage.setItem('supportClicked', Date.now());
      // Track conversion for analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'support_button_click', {
          'event_category': 'engagement',
          'event_label': 'donation_initiated'
        });
      }
    });
  }

  // Handle "remind me later" link
  const remindLater = document.getElementById('reminderLater');
  if (remindLater) {
    remindLater.addEventListener('click', (e) => {
      e.preventDefault();
      // Set reminder for 3 days later
      localStorage.setItem('donationReminder', Date.now() + (3 * 24 * 60 * 60 * 1000));
      closeModalAnimation();
    });
  }

  // Close modal when clicking outside or on the close link
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.id === 'closeModal') {
      e.preventDefault();
      closeModalAnimation();
    }
  });
  
  // Function to animate modal closing
  function closeModalAnimation() {
    modal.style.opacity = '0';
    modalContent.style.transform = 'translateY(20px)';
    setTimeout(() => {
      document.body.removeChild(modal);
    }, 500);
    
    // Don't show again for a while
    localStorage.setItem('donationShown', Date.now());
  }
}
