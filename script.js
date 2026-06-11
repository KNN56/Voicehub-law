// ===== Navigation Mobile Toggle =====
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// ปิดเมนูเมื่อคลิกลิงก์
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// ===== Active Link on Scroll =====
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===== Number Counter Animation =====
const statNumbers = document.querySelectorAll('.stat-number');

const animateCounter = (element) => {
    const target = parseInt(element.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
        current += step;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString();
        }
    };

    updateCounter();
};

// Intersection Observer สำหรับ counter
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            statNumbers.forEach(animateCounter);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// ===== FAQ Accordion =====
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });
        item.classList.toggle('active');
    });
});

// ===== Supabase Setup =====
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
    'https://jcomkijbdmeyffekfarg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjb21raWpiZG1leWZmZWtmYXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTM2OTMsImV4cCI6MjA5MzE4OTY5M30.Rmy2E3a36qFZKsqKEMlrIK9uKPdx8dmnN0m7IJ1tquU'
)

// ===== สร้างรหัสติดตาม =====
function generateTrackingCode() {
    const year = new Date().getFullYear()
    const random = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
    return `VCE-${year}-${random}`
}

// ===== Form Submission =====
const feedbackForm = document.getElementById('feedbackForm');
const successModal = document.getElementById('successModal');

feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // สร้างรหัสติดตาม
    const trackingCode = generateTrackingCode()

    const formData = {
        student_id: document.getElementById('studentId').value,
        faculty: document.getElementById('faculty').value,
        category: document.getElementById('category').value,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        email: document.getElementById('email').value,
        anonymous: document.getElementById('anonymous').checked,
        status: 'pending',
        tracking_code: trackingCode  // บันทึกรหัสลง database
    }

    // บันทึกลง Supabase
    const { error } = await supabase
        .from('submissions')
        .insert([formData])

    if (error) {
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
        console.error(error)
        return
    }

    // แสดงรหัสติดตามใน Modal
    document.querySelector('.tracking-display').textContent = trackingCode
    successModal.classList.add('show')
    feedbackForm.reset()
});

function closeModal() {
    successModal.classList.remove('show');
}

// ปิด Modal เมื่อคลิกข้างนอก
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        closeModal();
    }
});

// ===== ระบบ Tracking คำร้อง =====
const trackingInput = document.getElementById('trackingInput')
const trackBtn = document.getElementById('trackBtn')

if (trackBtn) {
    trackBtn.addEventListener('click', async () => {
        const code = trackingInput.value.trim().toUpperCase()

        if (!code) {
            alert('กรุณากรอกรหัสติดตามก่อนครับ')
            return
        }

        // ค้นหาในฐานข้อมูล
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('tracking_code', code)
            .single()

        if (error || !data) {
            document.getElementById('trackingResult').innerHTML = `
                <div class="status-card" style="text-align:center; padding: 2rem;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem">❌</div>
                    <p style="color: #6B7280;">ไม่พบรหัส <strong>${code}</strong> กรุณาตรวจสอบอีกครั้ง</p>
                </div>`
            return
        }

        // แปลงสถานะ
        const statusMap = {
            pending: { label: 'รอดำเนินการ', color: '#F59E0B', icon: '⏳' },
            progress: { label: 'กำลังดำเนินการ', color: '#3B82F6', icon: '🔄' },
            done: { label: 'เสร็จสิ้นแล้ว', color: '#10B981', icon: '✅' }
        }
        const status = statusMap[data.status] || statusMap['pending']

        const date = new Date(data.created_at).toLocaleDateString('th-TH', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })

        document.getElementById('trackingResult').innerHTML = `
            <div class="status-card">
                <div class="status-header">
                    <span class="tracking-code">รหัส: ${data.tracking_code}</span>
                    <span class="status-badge" style="background: ${status.color}20; color: ${status.color}">
                        ${status.icon} ${status.label}
                    </span>
                </div>
                <h3>${data.title || 'ไม่มีหัวข้อ'}</h3>
                <p style="color: #6B7280; margin: 0.5rem 0;">หมวดหมู่: ${data.category || '-'} | สาขา: ${data.faculty || '-'}</p>

                <div class="status-timeline" style="margin-top: 1.5rem;">
                    <div class="timeline-item ${['pending','progress','done'].includes(data.status) ? 'completed' : ''}">
                        <div class="timeline-dot"></div>
                        <span class="timeline-text">✅ ได้รับคำร้องแล้ว</span>
                        <span class="timeline-date">${date}</span>
                    </div>
                    <div class="timeline-item ${data.status === 'progress' || data.status === 'done' ? 'completed' : data.status === 'pending' ? 'active' : ''}">
                        <div class="timeline-dot"></div>
                        <span class="timeline-text">🔄 กำลังดำเนินการ</span>
                        <span class="timeline-date">${data.status === 'pending' ? 'รอดำเนินการ' : ''}</span>
                    </div>
                    <div class="timeline-item ${data.status === 'done' ? 'completed' : ''}">
                        <div class="timeline-dot"></div>
                        <span class="timeline-text">✅ เสร็จสิ้น</span>
                        <span class="timeline-date">${data.status !== 'done' ? 'ยังไม่เสร็จสิ้น' : ''}</span>
                    </div>
                </div>
            </div>`
    })
}

// ===== Smooth Scroll for Safari =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
