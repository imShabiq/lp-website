// Simple script for form submission and scroll effects

document.addEventListener('DOMContentLoaded', () => {
    // Shared elements for scroll
    const header = document.querySelector('.header');
    const heroSlidesParallax = document.querySelector('.hero-slides');
    const heroContentParallax = document.querySelector('.hero-content');
    const heroOverlayParallax = document.querySelector('.hero-overlay');
    const businessImage = document.querySelector('.business-image img');
    const revealElements = document.querySelectorAll('.service-card, .review-card, .section-header');
    const backToTop = document.getElementById('back-to-top');
    
    // Initial styles for reveal
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s ease-out';
    });

    // 4. Reveal on Scroll (Using Intersection Observer for Performance)
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, revealOptions);

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback for older browsers
        revealElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }

    // Centralized scroll listener for header and back-to-top (Lightweight)
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                
                // Header background change
                if (header) {
                    if (scrollY > 100) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                }
                
                // Back to Top Button visibility
                if (backToTop) {
                    if (scrollY > 500) {
                        backToTop.classList.add('active');
                    } else {
                        backToTop.classList.remove('active');
                    }
                }
                
                ticking = false;
            });
            ticking = true;
        }
    });

    // Trigger scroll event once on load to initialize elements
    window.dispatchEvent(new Event('scroll'));

    // Hero Slideshow Logic
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        const nextSlide = () => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        };
        setInterval(nextSlide, 5000); // Change every 5 seconds
    }

    // Dynamic Tagline Randomization
    const taglines = [
        {
            title: "Premium Care for Your Luxury Wear",
            desc: "We don't just wash clothes; we preserve the integrity of your most cherished garments with meticulous care."
        },
        {
            title: "Precision guides every process at LaundroPlus",
            desc: "Each treatment is carefully selected to suit the fabric it care for!"
        },
        {
            title: "Branded garments deserve understanding, not just cleaning.",
            desc: "LaundroPlus washmasters handle every garment with insight and mastery!."
        },
        {
            title: "Luxury Fabric Dont't follow general Rules",
            desc: "That's why LaundroPlus inspect every fabric before washing, diving your luxury garments the care they truly deserve!"
        }
    ];

    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-description');

    if (heroTitle && heroDesc) {
        const randomIndex = Math.floor(Math.random() * taglines.length);
        heroTitle.textContent = taglines[randomIndex].title;
        heroDesc.textContent = taglines[randomIndex].desc;
    }

    // Reviews Auto-Scroll
    const reviewsTrack = document.querySelector('.reviews-track');
    if (reviewsTrack) {
        let isHovered = false;

        // Pause on hover
        reviewsTrack.addEventListener('mouseenter', () => isHovered = true);
        reviewsTrack.addEventListener('mouseleave', () => isHovered = false);

        // Keep a reference to the original cards
        const originalCards = Array.from(reviewsTrack.children);

        // Duplicate the cards dynamically to create an infinite buffer
        originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            // Hide clones from screen readers and simplify
            clone.setAttribute('aria-hidden', 'true');
            reviewsTrack.appendChild(clone);
        });

        setInterval(() => {
            if (!isHovered) {
                const cardWidth = 480; // card block (450px) + gap (30px)
                const totalOriginalWidth = originalCards.length * cardWidth;

                // If we've reached the duplicated cards portion, quickly snap back
                // to the same visual position in the original portion without animation!
                if (reviewsTrack.scrollLeft >= totalOriginalWidth) {
                    reviewsTrack.style.scrollBehavior = 'auto';
                    reviewsTrack.scrollLeft = reviewsTrack.scrollLeft - totalOriginalWidth;
                }

                // Wait a tiny bit (50ms) to ensure the snap-back happened, then smoothly scroll forward
                setTimeout(() => {
                    reviewsTrack.style.scrollBehavior = 'smooth';
                    reviewsTrack.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }, 50);
            }
        }, 5000);
    }

    // Mobile Menu Logic
    const menuToggle = document.getElementById('mobile-menu');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-list a');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navList.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navList.classList.remove('active');
            });
        });
    }

    // Outlet Selection logic
    const outletCards = document.querySelectorAll('.outlet-card');
    const googleMap = document.getElementById('google-map');

    // Google Maps URLs
    const locations = {
        mayfair: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.772321722565!2d79.84532957403337!3d6.917800793081797!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259004741ec17%3A0x6d810d8b8de10559!2sLaundro%20Plus%20-%20Cinnamon%20Grand!5e0!3m2!1sen!2slk!4v1774523213361!5m2!1sen!2slk",
        chelsea: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.7838648073925!2d79.86576137403341!3d6.91642439308316!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259932640755b%3A0xc12021bb683bec3f!2sLaundro%20Plus%20Laundry%20-%20Ward%20Place!5e0!3m2!1sen!2slk!4v1774576510148!5m2!1sen!2slk",
        knightsbridge: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15843.39653155344!2d79.84087804465487!3d6.908636678902402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259002f5e1d2b%3A0x5e545dec40f14ec8!2sLaundro%20Plus%20at%20Tri-Zen!5e0!3m2!1sen!2slk!4v1774758677903!5m2!1sen!2slk"
    };

    outletCards.forEach(card => {
        card.addEventListener('click', () => {
            const loc = card.getAttribute('data-location');
            outletCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Update Google Map source
            if (googleMap && locations[loc]) {
                googleMap.src = locations[loc];
            }
        });
    });

    // Track Order Logic (Connected to Supabase)
    const openTrack = document.getElementById('open-track');
    const closeTrack = document.getElementById('close-track');
    const trackOverlay = document.getElementById('track-overlay');
    const trackSubmit = document.getElementById('track-submit');
    const orderInput = document.getElementById('order-id');
    const trackResult = document.getElementById('track-result');
    const resultStatus = document.getElementById('result-status');
    const resultBill = document.getElementById('result-bill');

    // Supabase Credentials (USER: Replace with your own keys)
    const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
    
    let supabaseClient = null;
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    openTrack.addEventListener('click', () => trackOverlay.classList.add('active'));
    closeTrack.addEventListener('click', () => {
        trackOverlay.classList.remove('active');
        trackResult.classList.add('hidden');
        orderInput.value = '';
    });

    trackSubmit.addEventListener('click', async () => {
        const id = orderInput.value.trim().toUpperCase();
        if (!id) return;

        if (!supabaseClient) {
            alert('Database connection not initialized. Please check your Supabase keys.');
            return;
        }

        // Luxury Loading State
        const originalText = trackSubmit.textContent;
        trackSubmit.disabled = true;
        trackSubmit.textContent = 'Seeking...';
        trackResult.classList.add('hidden');

        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('order_id', id)
                .single();

            if (error || !data) {
                alert('Order not found. Please verify your order ID.');
            } else {
                resultStatus.textContent = data.status;
                resultBill.textContent = data.bill_value || data.bill || 'N/A';
                trackResult.classList.remove('hidden');
            }
        } catch (err) {
            console.error('Tracking Error:', err);
            alert('A connection error occurred. Please try again later.');
        } finally {
            trackSubmit.disabled = false;
            trackSubmit.textContent = originalText;
        }
    });

    // Close on outside click
    trackOverlay.addEventListener('click', (e) => {
        if (e.target === trackOverlay) closeTrack.click();
    });

    // Form submission handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form data
            const formData = new FormData(contactForm);
            const name = contactForm.querySelector('input[type="text"]').value;

            // Show success message (luxury style)
            const button = contactForm.querySelector('button');
            const originalText = button.textContent;

            button.disabled = true;
            button.textContent = 'Sending...';

            setTimeout(() => {
                button.textContent = 'Thank You, ' + name;
                button.style.backgroundColor = '#28a745'; // Green for success
                contactForm.reset();

                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = originalText;
                    button.style.backgroundColor = ''; // Reset to CSS variable
                }, 3000);
            }, 1500);
        });
    }

    // Smooth scroll for nav links (already handled by CSS but for older browsers or refined control)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Back to Top Logic
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Newsletter Form Handling
    const newsletterForm = document.querySelector('.footer-newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input').value;
            const button = newsletterForm.querySelector('button');

            button.disabled = true;
            button.textContent = '...';

            setTimeout(() => {
                button.textContent = 'Sent';
                button.style.backgroundColor = '#28a745';
                newsletterForm.reset();

                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = 'Join';
                    button.style.backgroundColor = '';
                }, 3000);
            }, 1000);
        });
    }

});
