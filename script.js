/* ================================================================
   BIRTHDAY WEBSITE — INTERACTIONS
   Important personalisation points are clearly labelled below.
   ================================================================ */

'use strict';

document.documentElement.classList.add('js-ready');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/* Small helpers keep the rest of the file easy to read. */
const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function safelyRun(callback) {
  try {
    callback();
  } catch (error) {
    // Optional interactions should never make the rest of the gift unusable.
    console.warn('A non-essential birthday interaction could not start.', error);
  }
}

function smoothScrollTo(selector) {
  const target = select(selector);
  if (!target) return;

  target.scrollIntoView({
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    block: 'start'
  });
}

/* ================================================================
   1. LOADING SCREEN, OPENING OVERLAY & OPTIONAL MUSIC
   ================================================================ */
const loadingScreen = select('#loadingScreen');
const entrance = select('#entrance');
const openingGift = select('#openingGift');
const openSurpriseButton = select('#openSurpriseButton');
const siteHeader = select('#siteHeader');
const siteMain = select('#siteMain');
const musicControl = select('#musicControl');
const backgroundMusic = select('#backgroundMusic');

let experienceHasOpened = false;
let musicIsAvailable = true;

function showEntranceAfterLoading() {
  if (!loadingScreen || !entrance) return;

  window.setTimeout(() => {
    loadingScreen.classList.add('is-leaving');
    entrance.hidden = false;

    window.setTimeout(() => {
      loadingScreen.hidden = true;
      openSurpriseButton?.focus();
    }, 460);
  }, 1000);
}

function updateMusicControl() {
  if (!musicControl || !backgroundMusic) return;

  const isPlaying = !backgroundMusic.paused && !backgroundMusic.ended;
  const label = select('.music-control__label', musicControl);

  musicControl.classList.toggle('is-playing', isPlaying);
  musicControl.setAttribute(
    'aria-label',
    isPlaying ? 'Pause background music' : 'Play background music'
  );

  if (label) {
    label.textContent = isPlaying ? 'Music playing' : 'Music paused';
  }
}

async function attemptToPlayMusic() {
  if (!backgroundMusic || !musicIsAvailable) return;

  try {
    await backgroundMusic.play();
  } catch (error) {
    // Browsers may block playback or the optional file may be absent.
    // The visual experience continues normally and the control remains available.
  }

  updateMusicControl();
}

function openBirthdayExperience() {
  if (experienceHasOpened) return;
  experienceHasOpened = true;

  entrance?.classList.add('is-opening');
  openingGift?.classList.add('is-open');
  openSurpriseButton?.setAttribute('disabled', '');

  window.setTimeout(() => {
    entrance?.classList.add('is-leaving');
    document.body.classList.remove('experience-locked');

    if (siteHeader) siteHeader.hidden = false;
    if (musicControl) musicControl.hidden = false;
    if (siteMain) {
      siteMain.setAttribute('aria-hidden', 'false');
      siteMain.classList.add('is-visible');
    }

    attemptToPlayMusic();

    window.setTimeout(() => {
      if (entrance) entrance.hidden = true;
      smoothScrollTo('#home');
    }, 660);
  }, prefersReducedMotion.matches ? 30 : 720);
}

showEntranceAfterLoading();
openSurpriseButton?.addEventListener('click', openBirthdayExperience);

musicControl?.addEventListener('click', async () => {
  if (!backgroundMusic || !musicIsAvailable) return;

  if (backgroundMusic.paused) {
    await attemptToPlayMusic();
  } else {
    backgroundMusic.pause();
    updateMusicControl();
  }
});

backgroundMusic?.addEventListener('play', updateMusicControl);
backgroundMusic?.addEventListener('pause', updateMusicControl);
backgroundMusic?.addEventListener('error', () => {
  musicIsAvailable = false;
  updateMusicControl();
});

/* ================================================================
   2. MOBILE NAVIGATION & SMOOTH-SCROLL BUTTONS
   ================================================================ */
const menuToggle = select('#menuToggle');
const navigationLinks = select('#navigationLinks');

function closeMobileMenu({ returnFocus = false } = {}) {
  if (!menuToggle || !navigationLinks) return;

  navigationLinks.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation menu');

  if (returnFocus) menuToggle.focus();
}

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
  navigationLinks?.classList.toggle('is-open', !isOpen);
});

selectAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => closeMobileMenu());
});

document.addEventListener('click', (event) => {
  if (!navigationLinks?.classList.contains('is-open')) return;
  if (event.target instanceof Node && !select('.navigation')?.contains(event.target)) {
    closeMobileMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigationLinks?.classList.contains('is-open')) {
    closeMobileMenu({ returnFocus: true });
  }
});

selectAll('[data-scroll-to]').forEach((button) => {
  button.addEventListener('click', () => {
    const targetSelector = button.getAttribute('data-scroll-to');
    if (targetSelector) smoothScrollTo(targetSelector);
  });
});

/* ================================================================
   3. IMAGE FALLBACKS
   A missing photo becomes a styled “Our photo” panel.
   ================================================================ */
function showImageFallback(image) {
  const shell = image.closest('.image-shell');
  shell?.classList.add('image-missing');
}

selectAll('[data-fallback-image]').forEach((image) => {
  image.addEventListener('error', () => showImageFallback(image));
  image.addEventListener('load', () => image.closest('.image-shell')?.classList.remove('image-missing'));

  if (image.complete && image.naturalWidth === 0) {
    showImageFallback(image);
  }
});

/* ================================================================
   4. SCROLL REVEALS & ACTIVE NAVIGATION
   ================================================================ */
const revealItems = selectAll('.reveal');

if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.13, rootMargin: '0px 0px -7% 0px' }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = String(Math.min((index % 3) * 70, 140)) + 'ms';
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-revealed'));
}

const navTargets = selectAll('#home, #photos, #quiz, #coupons, #letter');
const navLinks = selectAll('.nav-link');

if ('IntersectionObserver' in window) {
  const activeSectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

      if (!visibleEntries.length) return;
      const activeId = visibleEntries[0].target.id;

      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + activeId);
      });
    },
    { rootMargin: '-28% 0px -58% 0px', threshold: [0, 0.1, 0.25] }
  );

  navTargets.forEach((section) => activeSectionObserver.observe(section));
}

/* ================================================================
   5. PLAYFUL BIRTHDAY QUESTION
   The “proof” button moves only twice for pointer users. Keyboard
   activation works immediately, so the interaction stays accessible.
   ================================================================ */
const obviousAnswer = select('#obviousAnswer');
const proofAnswer = select('#proofAnswer');
const questionActions = select('#questionActions');
const questionResponse = select('#questionResponse');
let proofMoveCount = 0;

function showQuestionResponse(message) {
  if (questionResponse) questionResponse.textContent = message;
}

function moveProofButton(event) {
  if (!proofAnswer || !questionActions || proofMoveCount >= 2) return;
  if (event.pointerType === '' || event.pointerType === undefined) return;

  event.preventDefault();
  proofMoveCount += 1;
  proofAnswer.classList.add('is-moving');

  const maximumLeft = Math.max(0, questionActions.clientWidth - proofAnswer.offsetWidth);
  const maximumTop = Math.max(0, questionActions.clientHeight - proofAnswer.offsetHeight);
  const nextLeft = Math.round(Math.random() * maximumLeft);
  const nextTop = Math.round(Math.random() * maximumTop);

  proofAnswer.style.left = nextLeft + 'px';
  proofAnswer.style.top = nextTop + 'px';
  proofAnswer.textContent = proofMoveCount === 1 ? 'Almost…' : 'Okay, one more try';
}

obviousAnswer?.addEventListener('click', () => {
  showQuestionResponse('Good answer. I knew you would understand.');
});

proofAnswer?.addEventListener('pointerdown', moveProofButton);
proofAnswer?.addEventListener('click', (event) => {
  // detail === 0 means the button was activated with a keyboard.
  if (proofMoveCount < 2 && event.detail > 0) return;

  proofAnswer.classList.remove('is-moving');
  proofAnswer.removeAttribute('style');
  proofAnswer.textContent = 'I need proof';
  showQuestionResponse('There’s your proof: I made this whole website just for you.');
});

/* ================================================================
   6. FULL-SCREEN PHOTO LIGHTBOX
   EDIT PHOTO CAPTIONS: change the visible captions in index.html.
   The lightbox reads those captions automatically.
   ================================================================ */
const galleryCards = selectAll('[data-gallery-index]');
const lightbox = select('#lightbox');
const lightboxImage = select('#lightboxImage');
const lightboxPlaceholder = select('.lightbox__placeholder');
const lightboxCaption = select('#lightboxCaption');
const lightboxClose = select('#lightboxClose');
const lightboxPrevious = select('#lightboxPrevious');
const lightboxNext = select('#lightboxNext');

let currentPhotoIndex = 0;
let previouslyFocusedElement = null;

const galleryPhotos = galleryCards.map((card) => {
  const image = select('img', card);
  const caption = select('.polaroid__caption', card);

  return {
    source: image?.getAttribute('src') || '',
    alternativeText: image?.getAttribute('alt') || 'Our photograph',
    caption: caption?.textContent?.trim() || 'Our photo',
    rotation: image?.classList.contains('photo-rotate-ccw')
      ? -90
      : image?.classList.contains('photo-rotate-cw')
        ? 90
        : 0
  };
});

function updateLightboxPhoto() {
  const photo = galleryPhotos[currentPhotoIndex];
  if (!photo || !lightboxImage || !lightboxCaption) return;

  lightboxImage.hidden = false;
  if (lightboxPlaceholder) lightboxPlaceholder.hidden = false;
  lightboxImage.alt = photo.alternativeText;
  lightboxImage.classList.toggle('photo-rotate-lightbox', photo.rotation !== 0);
  lightboxImage.style.transform = photo.rotation ? 'rotate(' + photo.rotation + 'deg)' : '';
  lightboxCaption.textContent = photo.caption;

  lightboxImage.onload = () => {
    lightboxImage.hidden = false;
    if (lightboxPlaceholder) lightboxPlaceholder.hidden = true;
  };

  lightboxImage.onerror = () => {
    lightboxImage.hidden = true;
    if (lightboxPlaceholder) lightboxPlaceholder.hidden = false;
  };

  lightboxImage.src = '';
  lightboxImage.src = photo.source;
}

function openLightbox(index) {
  if (!lightbox || !galleryPhotos.length) return;

  currentPhotoIndex = index;
  previouslyFocusedElement = document.activeElement;
  lightbox.hidden = false;
  document.body.classList.add('lightbox-open');
  updateLightboxPhoto();
  lightboxClose?.focus();
}

function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;

  lightbox.hidden = true;
  document.body.classList.remove('lightbox-open');

  if (previouslyFocusedElement instanceof HTMLElement) {
    previouslyFocusedElement.focus();
  }
}

function showAdjacentPhoto(direction) {
  if (!galleryPhotos.length) return;
  currentPhotoIndex = (currentPhotoIndex + direction + galleryPhotos.length) % galleryPhotos.length;
  updateLightboxPhoto();
}

galleryCards.forEach((card, index) => {
  card.addEventListener('click', () => openLightbox(index));
});

lightboxClose?.addEventListener('click', closeLightbox);
select('[data-close-lightbox]')?.addEventListener('click', closeLightbox);
lightboxPrevious?.addEventListener('click', () => showAdjacentPhoto(-1));
lightboxNext?.addEventListener('click', () => showAdjacentPhoto(1));

document.addEventListener('keydown', (event) => {
  if (!lightbox || lightbox.hidden) return;

  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') showAdjacentPhoto(-1);
  if (event.key === 'ArrowRight') showAdjacentPhoto(1);

  if (event.key === 'Tab') {
    const focusableElements = selectAll('button:not([disabled])', lightbox);
    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
});

/* ================================================================
   7. “HOW WELL DO YOU KNOW US?” QUIZ
   EDIT QUIZ QUESTIONS, OPTIONS & CORRECT ANSWERS HERE.
   correctAnswer is the zero-based position in the options array.
   ================================================================ */
const quizQuestions = [
  {
    question: 'Who is more dramatic?',
    options: ['khalil', 'Fatima Ezzahra', 'Both, depending on the day', 'We need video evidence'],
    correctAnswer: 2,
    response: 'Good answer. Very safe too.'
  },
  {
    question: 'Who takes longer to choose what to eat?',
    options: ['khalil', 'Fatima Ezzahra', 'We both say “anything” and reject everything', 'Food chooses us'],
    correctAnswer: 2,
    response: 'Yep. That is basically us every time we’re hungry.'
  },
  {
    question: 'What is the perfect plan for us?',
    options: ['eating', 'Getting food', 'Being together without needing a plan', 'All of the above'],
    correctAnswer: 3,
    response: 'Exactly. As long as we’re together, the plan is already good.'
  },
  {
    question: 'How much do I care about you?',
    options: ['A little', 'A lot', 'More than I can explain', 'This question cannot be measured'],
    correctAnswer: 3,
    response: 'Correct. There isn’t a button big enough for the real answer.'
  },
  {
    question: 'What does the birthday girl deserve today?',
    options: ['Cake', 'Gifts', 'Love and happiness', 'Everything above and much more'],
    correctAnswer: 3,
    response: 'Obviously. Anything less would be unacceptable.'
  }
];

const quizCounter = select('#quizCounter');
const quizScore = select('#quizScore');
const quizProgress = select('.quiz-progress');
const quizProgressBar = select('#quizProgressBar');
const quizQuestionView = select('#quizQuestionView');
const quizQuestion = select('#quizQuestion');
const quizOptions = select('#quizOptions');
const quizFeedback = select('#quizFeedback');
const nextQuestionButton = select('#nextQuestionButton');
const quizResult = select('#quizResult');
const quizResultMessage = select('#quizResultMessage');
const quizFinalScore = select('#quizFinalScore');
const restartQuizButton = select('#restartQuizButton');

let currentQuestionIndex = 0;
let currentQuizScore = 0;
let hasAnsweredCurrentQuestion = false;

function renderQuizQuestion() {
  const currentQuestion = quizQuestions[currentQuestionIndex];
  if (!currentQuestion || !quizOptions || !quizQuestion) return;

  hasAnsweredCurrentQuestion = false;
  quizQuestion.textContent = currentQuestion.question;
  quizOptions.replaceChildren();

  currentQuestion.options.forEach((option, optionIndex) => {
    const optionButton = document.createElement('button');
    optionButton.type = 'button';
    optionButton.className = 'quiz-option';
    optionButton.textContent = option;
    optionButton.addEventListener('click', () => selectQuizAnswer(optionIndex, optionButton));
    quizOptions.append(optionButton);
  });

  if (quizCounter) quizCounter.textContent = 'Question ' + (currentQuestionIndex + 1) + ' of ' + quizQuestions.length;
  if (quizScore) quizScore.textContent = 'Score: ' + currentQuizScore;
  if (quizFeedback) quizFeedback.textContent = '';
  if (nextQuestionButton) {
    nextQuestionButton.disabled = true;
    nextQuestionButton.textContent =
      currentQuestionIndex === quizQuestions.length - 1 ? 'See My Result' : 'Next Question';
  }

  const currentProgress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
  if (quizProgressBar) quizProgressBar.style.width = currentProgress + '%';
  quizProgress?.setAttribute('aria-valuenow', String(currentQuestionIndex + 1));
}

function selectQuizAnswer(selectedIndex, selectedButton) {
  if (hasAnsweredCurrentQuestion) return;
  hasAnsweredCurrentQuestion = true;

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const optionButtons = selectAll('.quiz-option', quizOptions);
  const answerIsCorrect = selectedIndex === currentQuestion.correctAnswer;

  if (answerIsCorrect) currentQuizScore += 1;

  optionButtons.forEach((button, index) => {
    button.disabled = true;
    if (index === selectedIndex) button.classList.add('is-selected');
    if (index === currentQuestion.correctAnswer) button.classList.add('is-correct');
  });

  selectedButton.classList.add('is-selected');
  if (quizFeedback) {
    quizFeedback.textContent = answerIsCorrect
      ? currentQuestion.response
      : 'Hmm… not the answer I had in mind, but I respect the confidence.';
  }
  if (quizScore) quizScore.textContent = 'Score: ' + currentQuizScore;
  if (nextQuestionButton) nextQuestionButton.disabled = false;
}

function showQuizResult() {
  if (quizQuestionView) quizQuestionView.hidden = true;
  if (quizResult) quizResult.hidden = false;

  let resultMessage = 'That score is a little suspicious… but okay, I’ll let it slide because it’s your birthday.';
  if (currentQuizScore >= 5) {
    resultMessage = 'Okay wow, perfect score. You really do know our nonsense.';
  } else if (currentQuizScore >= 3) {
    resultMessage = 'Not bad at all. I’m keeping you.';
  }

  if (quizResultMessage) quizResultMessage.textContent = resultMessage;
  if (quizFinalScore) quizFinalScore.textContent = 'Final score: ' + currentQuizScore + ' / ' + quizQuestions.length;
  if (quizCounter) quizCounter.textContent = 'Quiz complete';
  if (quizProgressBar) quizProgressBar.style.width = '100%';
  quizProgress?.setAttribute('aria-valuenow', String(quizQuestions.length));
}

function restartQuiz() {
  currentQuestionIndex = 0;
  currentQuizScore = 0;
  hasAnsweredCurrentQuestion = false;

  if (quizResult) quizResult.hidden = true;
  if (quizQuestionView) quizQuestionView.hidden = false;
  renderQuizQuestion();
}

nextQuestionButton?.addEventListener('click', () => {
  if (!hasAnsweredCurrentQuestion) return;

  if (currentQuestionIndex < quizQuestions.length - 1) {
    currentQuestionIndex += 1;
    renderQuizQuestion();
  } else {
    showQuizResult();
  }
});

restartQuizButton?.addEventListener('click', restartQuiz);
renderQuizQuestion();

/* ================================================================
   8. BIRTHDAY COUPONS WITH localStorage
   Coupon IDs come from data-coupon-id attributes in index.html.
   ================================================================ */
const couponStorageKey = 'fatimaBirthdayClaimedCoupons';
const couponCards = selectAll('[data-coupon-id]');
const resetCouponsButton = select('#resetCouponsButton');

function readClaimedCoupons() {
  try {
    const savedCoupons = JSON.parse(localStorage.getItem(couponStorageKey) || '[]');
    return Array.isArray(savedCoupons) ? savedCoupons : [];
  } catch (error) {
    return [];
  }
}

function saveClaimedCoupons(couponIds) {
  try {
    localStorage.setItem(couponStorageKey, JSON.stringify(couponIds));
  } catch (error) {
    // Private browsing or strict file settings can disable localStorage.
    // The claim still works for the current visit.
  }
}

function updateCouponCard(card, isClaimed) {
  const claimButton = select('.claim-coupon', card);
  card.classList.toggle('is-claimed', isClaimed);

  if (claimButton) {
    claimButton.textContent = isClaimed ? 'Claimed' : 'Claim Coupon';
    claimButton.disabled = isClaimed;
    claimButton.setAttribute('aria-label', isClaimed ? 'Coupon already claimed' : 'Claim this coupon');
  }
}

function restoreCouponStates() {
  const claimedCouponIds = readClaimedCoupons();
  couponCards.forEach((card) => {
    updateCouponCard(card, claimedCouponIds.includes(card.dataset.couponId));
  });
}

couponCards.forEach((card) => {
  const claimButton = select('.claim-coupon', card);
  const couponTitle = select('h3', card)?.textContent || 'this coupon';

  claimButton?.addEventListener('click', () => {
    const confirmed = window.confirm('Use your “' + couponTitle + '” coupon now?');
    if (!confirmed) return;

    const couponId = card.dataset.couponId;
    const claimedCouponIds = readClaimedCoupons();
    if (couponId && !claimedCouponIds.includes(couponId)) {
      claimedCouponIds.push(couponId);
      saveClaimedCoupons(claimedCouponIds);
    }

    updateCouponCard(card, true);
  });
});

resetCouponsButton?.addEventListener('click', () => {
  const confirmed = window.confirm('Start all the coupons over?');
  if (!confirmed) return;

  saveClaimedCoupons([]);
  couponCards.forEach((card) => updateCouponCard(card, false));
});

restoreCouponStates();

/* ================================================================
   9. SECRET MESSAGE
   EDIT SECRET PASSWORD HERE. It is case-insensitive.
   ================================================================ */
const SECRET_PASSWORD = 'titimaa';

const secretForm = select('#secretForm');
const secretPassword = select('#secretPassword');
const passwordFeedback = select('#passwordFeedback');
const secretMessage = select('#secretMessage');
const secretBox = select('#secretBox');

secretForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const enteredPassword = secretPassword?.value.trim().toLocaleLowerCase() || '';

  if (enteredPassword === SECRET_PASSWORD.toLocaleLowerCase()) {
    if (passwordFeedback) passwordFeedback.textContent = '';
    secretBox?.classList.add('is-unlocked');
    secretForm.hidden = true;
    if (secretMessage) {
      secretMessage.hidden = false;
      secretMessage.focus();
    }
  } else {
    if (passwordFeedback) passwordFeedback.textContent = 'Nope, not that one. Try the nickname I always call you.';
    secretPassword?.setAttribute('aria-invalid', 'true');
    secretPassword?.select();
  }
});

secretPassword?.addEventListener('input', () => {
  secretPassword.removeAttribute('aria-invalid');
  if (passwordFeedback) passwordFeedback.textContent = '';
});

/* ================================================================
   10. REUSABLE LOVE-LETTER ENVELOPE
   Edit the letter text inside index.html under EDIT FULL_LOVE_LETTER.
   ================================================================ */
const envelopeExperience = select('#envelopeExperience');
const envelopeButton = select('#envelopeButton');
const letterPaper = select('#letterPaper');
const letterToggleButton = select('#letterToggleButton');

function toggleLetter() {
  if (!envelopeExperience || !envelopeButton || !letterToggleButton) return;

  const willOpen = !envelopeExperience.classList.contains('is-open');
  envelopeExperience.classList.toggle('is-open', willOpen);
  envelopeButton.setAttribute('aria-expanded', String(willOpen));
  envelopeButton.setAttribute('aria-label', willOpen ? 'Close the birthday letter' : 'Open the birthday letter');
  letterToggleButton.setAttribute('aria-expanded', String(willOpen));
  letterToggleButton.textContent = willOpen ? 'Close the Letter' : 'Open the Letter';
  letterPaper?.setAttribute('aria-hidden', String(!willOpen));

  if (willOpen) {
    window.setTimeout(() => {
      letterPaper?.scrollIntoView({
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
        block: 'center'
      });
    }, prefersReducedMotion.matches ? 0 : 500);
  }
}

envelopeButton?.addEventListener('click', toggleLetter);
letterToggleButton?.addEventListener('click', toggleLetter);

/* ================================================================
   11. RANDOM BIRTHDAY WISH GENERATOR
   EDIT BIRTHDAY WISHES IN THIS ARRAY.
   ================================================================ */
const birthdayWishes = [
  'I hope this year gives you something new to be really excited about.',
  'I hope you keep choosing the things that make you feel calm and happy.',
  'I hope the good memories keep getting even better.',
  'I hope the things you keep talking about finally start happening.',
  'I hope you laugh until your cheeks hurt a lot this year.',
  'I hope people give you the same kindness you give them.',
  'I hope every hard moment leads you somewhere better.',
  'I hope you never forget how capable you are, even on bad days.',
  'I hope you get more peaceful days and fewer unnecessary headaches.',
  'I hope this year surprises you in really good ways.',
  'I hope you always feel loved, even when I’m annoying.',
  'And selfishly, I hope I get to celebrate many more birthdays with you.'
];

const generateWishButton = select('#generateWishButton');
const generatedWish = select('#generatedWish');
let previousWishIndex = -1;

function chooseDifferentWishIndex() {
  if (birthdayWishes.length <= 1) return 0;

  let nextWishIndex = previousWishIndex;
  while (nextWishIndex === previousWishIndex) {
    nextWishIndex = Math.floor(Math.random() * birthdayWishes.length);
  }
  return nextWishIndex;
}

generateWishButton?.addEventListener('click', () => {
  if (!generatedWish || !birthdayWishes.length) return;

  const nextWishIndex = chooseDifferentWishIndex();
  previousWishIndex = nextWishIndex;
  generatedWish.classList.remove('is-changing');
  void generatedWish.offsetWidth;
  generatedWish.classList.add('is-changing');

  window.setTimeout(() => {
    const wishParagraph = select('p', generatedWish);
    if (wishParagraph) wishParagraph.textContent = birthdayWishes[nextWishIndex];
  }, prefersReducedMotion.matches ? 0 : 250);
});

/* ================================================================
   12. SCROLL PROGRESS & BACK TO TOP
   ================================================================ */
const scrollProgress = select('#scrollProgress');
const backToTopButton = select('#backToTopButton');
let scrollFrameRequested = false;

function updateScrollInterface() {
  const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableDistance > 0 ? (window.scrollY / scrollableDistance) * 100 : 0;

  if (scrollProgress) scrollProgress.style.width = Math.min(100, Math.max(0, progress)) + '%';
  if (backToTopButton) backToTopButton.hidden = window.scrollY < window.innerHeight * 0.85;
  scrollFrameRequested = false;
}

window.addEventListener(
  'scroll',
  () => {
    if (scrollFrameRequested) return;
    scrollFrameRequested = true;
    window.requestAnimationFrame(updateScrollInterface);
  },
  { passive: true }
);

backToTopButton?.addEventListener('click', () => smoothScrollTo('#home'));
updateScrollInterface();

/* ================================================================
   13. FIVE-CLICK EASTER EGG
   ================================================================ */
const easterEggTrigger = select('.easter-egg-trigger');
const easterEgg = select('#easterEgg');
let headingClickCount = 0;
let easterEggHasOpened = false;
let clickResetTimer = 0;

function countEasterEggClick() {
  if (easterEggHasOpened) return;

  headingClickCount += 1;
  window.clearTimeout(clickResetTimer);
  clickResetTimer = window.setTimeout(() => {
    headingClickCount = 0;
  }, 4500);

  if (headingClickCount >= 5) {
    easterEggHasOpened = true;
    if (easterEgg) easterEgg.hidden = false;
  }
}

easterEggTrigger?.addEventListener('click', countEasterEggClick);
easterEggTrigger?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    countEasterEggClick();
  }
});

/* ================================================================
   14. SUBTLE DESKTOP-ONLY HEART CURSOR TRAIL
   Disabled automatically on touch devices and reduced-motion systems.
   ================================================================ */
let lastCursorHeartTime = 0;

function createCursorHeart(event) {
  if (!supportsFinePointer.matches || prefersReducedMotion.matches || !experienceHasOpened) return;

  const now = performance.now();
  if (now - lastCursorHeartTime < 90) return;
  lastCursorHeartTime = now;

  const heart = document.createElement('span');
  heart.className = 'cursor-heart';
  heart.textContent = '♥';
  heart.setAttribute('aria-hidden', 'true');
  heart.style.left = event.clientX + 'px';
  heart.style.top = event.clientY + 'px';
  document.body.append(heart);

  window.setTimeout(() => heart.remove(), 900);
}

document.addEventListener('pointermove', createCursorHeart, { passive: true });

/* Run optional setup sections without allowing one failure to affect others. */
safelyRun(() => {
  window.addEventListener('resize', () => {
    if (window.innerWidth > 704) closeMobileMenu();
  });
});
