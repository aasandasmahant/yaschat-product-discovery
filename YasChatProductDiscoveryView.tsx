import React, { useEffect, useMemo, useState } from 'react';
import {
	extractBudgetFromQuery,
	extractCategoryFromQuery,
	normalizeDiscoveryItem,
	pickUniqueBrandByTier,
	PriceTier,
	YasChatDiscoveryItem,
	buildUnlimitedDiscoveryItems,
	createViewerSessionSeed,
} from './yasChatDiscovery';
import { getSampleTenThousandMobiles } from './yasChatSampleData';

interface YasChatProductDiscoveryViewProps {
	initialItems?: YasChatDiscoveryItem[];
	defaultBudget?: number;
}

const TIER_ORDER: PriceTier[] = ['Low', 'Medium', 'High'];

const buildExtraCatalog = (budget: number): YasChatDiscoveryItem[] => {
	const base = getSampleTenThousandMobiles();
	const extraRaw = [
		{
			id: 'mob-low-2',
			title: 'EchoLite S2 (4GB / 64GB)',
			brand: 'EchoLite',
			affiliateNetwork: 'ShareASale',
			buyUrl: 'https://example.com/aff/echolite-s2',
			price: Math.max(1, Math.round(budget * 0.82)),
			images: [
				'https://example.com/img/s2-1.jpg',
				'https://example.com/img/s2-2.jpg',
				'https://example.com/img/s2-3.jpg',
				'https://example.com/img/s2-4.jpg',
				'https://example.com/img/s2-5.jpg',
			],
			metadata: {
				batteryPower: '5000mAh (सामान्य कॉलिंग व मैसेजिंग पर 1.5 दिन)',
				chargerInBox: true,
				chargerType: '15W Type-C Charger',
				chargerQuality: 'मानक बिल्ड क्वालिटी',
				earphoneInBox: false,
				earphoneDetails: 'बॉक्स में ईयरफोन नहीं मिलेगा',
				rearCamera: '16MP Rear Camera',
				frontCamera: '5MP Front Camera',
				ram: '4GB RAM',
				storage: '64GB',
				forGamer: 'हल्के गेम के लिए ठीक; हैवी गेम के लिए नहीं',
				forDailyUser: 'बेसिक कॉल व चैट के लिए सही',
				forHeavyUser: 'हैवी काम के लिए उपयुक्त नहीं',
			},
			whatYouGet: ['4GB RAM + 64GB स्टोरेज', '5000mAh बैटरी', '15W Type-C चार्जर'],
			whatYouDontGet: ['बॉक्स में ईयरफोन नहीं', 'हैवी गेमिंग सपोर्ट नहीं'],
			prosWhoShouldBuy: ['कम बजट में सरल फ़ोन चाहने वालों के लिए सही'],
			consWhoShouldAvoid: ['हैवी गेमिंग व हाई-कैमरा चाहने वालों के लिए ग़लत'],
			ratings: [{ platform: 'YouTube', score: '4.1/5 (81%)', summary: 'बजट में सरल अनुभव' }],
		},
		{
			id: 'mob-med-2',
			title: 'VibeCore V10 (6GB / 128GB)',
			brand: 'VibeCore',
			affiliateNetwork: 'CJ Affiliate',
			buyUrl: 'https://example.com/aff/vibecore-v10',
			price: Math.max(1, Math.round(budget * 0.98)),
			images: [
				'https://example.com/img/v10-1.jpg',
				'https://example.com/img/v10-2.jpg',
				'https://example.com/img/v10-3.jpg',
				'https://example.com/img/v10-4.jpg',
				'https://example.com/img/v10-5.jpg',
			],
			metadata: {
				batteryPower: '5000mAh (दैनिक उपयोग पर ~1 दिन)',
				chargerInBox: true,
				chargerType: '22.5W Type-C Charger',
				chargerQuality: 'अच्छी बिल्ड क्वालिटी',
				earphoneInBox: false,
				earphoneDetails: 'बॉक्स में ईयरफोन नहीं मिलेगा',
				rearCamera: '50MP Rear Camera',
				frontCamera: '8MP Front Camera',
				ram: '6GB RAM',
				storage: '128GB',
				forGamer: 'मध्यम गेमिंग तक ठीक',
				forDailyUser: 'रोज़मर्रा के काम व वीडियो के लिए सही',
				forHeavyUser: 'मध्यम से अधिक लोड में सावधानी ज़रूरी',
			},
			whatYouGet: ['6GB RAM + 128GB स्टोरेज', '50MP रियर + 8MP फ्रंट कैमरा', '22.5W Type-C चार्जर'],
			whatYouDontGet: ['बॉक्स में ईयरफोन नहीं', 'फ्लैगशिप स्तर की स्पीड नहीं'],
			prosWhoShouldBuy: ['लक्ष्य बजट के भीतर संतुलित फ़ोन चाहने वालों के लिए सही'],
			consWhoShouldAvoid: ['प्रो ई-स्पोर्ट्स गेमर्स के लिए ग़लत'],
			ratings: [{ platform: 'Reddit', score: '4.3/5 (85%)', summary: 'बजट में संतुलित विकल्प' }],
		},
		{
			id: 'mob-high-2',
			title: 'PulsePro P30 (8GB / 256GB)',
			brand: 'PulsePro',
			affiliateNetwork: 'ClickBank',
			buyUrl: 'https://example.com/aff/pulsepro-p30',
			price: Math.max(1, Math.round(budget * 1.12)),
			images: [
				'https://example.com/img/p30-1.jpg',
				'https://example.com/img/p30-2.jpg',
				'https://example.com/img/p30-3.jpg',
				'https://example.com/img/p30-4.jpg',
				'https://example.com/img/p30-5.jpg',
			],
			metadata: {
				batteryPower: '5500mAh (अधिक बैकअप व तेज़ चार्ज सपोर्ट)',
				chargerInBox: false,
				chargerType: 'बॉक्स में केवल Type-C केबल (चार्जर अलग से)',
				chargerQuality: 'चार्जर बॉक्स में शामिल नहीं',
				earphoneInBox: false,
				earphoneDetails: 'बॉक्स में ईयरफोन नहीं मिलेगा',
				rearCamera: '64MP Main + Ultrawide Rear Camera',
				frontCamera: '16MP Front Camera',
				ram: '8GB RAM',
				storage: '256GB',
				forGamer: 'बेहतर गेमिंग प्रदर्शन',
				forDailyUser: 'तेज़ और स्मूद अनुभव',
				forHeavyUser: 'अधिक स्टोरेज व मल्टीटास्किंग के लिए सही',
			},
			whatYouGet: ['8GB RAM + 256GB स्टोरेज', '5500mAh बैटरी', '64MP रियर + 16MP फ्रंट कैमरा'],
			whatYouDontGet: ['बॉक्स में चार्जर एडॉप्टर नहीं', 'बॉक्स में ईयरफोन नहीं'],
			prosWhoShouldBuy: ['ज़्यादा स्टोरेज व बेहतर कैमरा चाहने वालों के लिए सही'],
			consWhoShouldAvoid: ['बॉक्स में चार्जर साथ चाहने वालों के लिए ग़लत'],
			ratings: [{ platform: 'RSS', score: '4.4/5 (87%)', summary: 'कैमरा व स्टोरेज पर सकारात्मक राय' }],
		},
	];

	const normalizedExtra = extraRaw
		.map((item) => normalizeDiscoveryItem(item, budget))
		.filter((item) => item.isValid);

	return [...base, ...normalizedExtra];
};

export const YasChatProductDiscoveryView: React.FC<YasChatProductDiscoveryViewProps> = ({
	initialItems,
	defaultBudget = 10000,
}) => {
	const YASCHAT_STORY_CIRCLES = [{ label: 'Your Story', query: 'community story', ring: '#ec4899' },{ label: 'Global', query: 'global trends', ring: '#2563eb' },{ label: 'Products', query: 'trending products', ring: '#f59e0b' },{ label: 'Community', query: 'community discussion', ring: '#10b981' },{ label: 'More', query: 'all guides', ring: '#8b5cf6' }];
const [activeNav, setActiveNav] = useState('Home');
const [query, setQuery] = useState(`${defaultBudget} mobile phone`);
	const [activeBudget, setActiveBudget] = useState<number>(defaultBudget);
	const [viewerSessionSeed] = useState<number>(() => createViewerSessionSeed());
	const [unlimitedRound, setUnlimitedRound] = useState<number>(0);
	const [usedBrands, setUsedBrands] = useState<Set<string>>(() => new Set());
	const [historyStack, setHistoryStack] = useState<Record<PriceTier, YasChatDiscoveryItem | null>[]>([]);
	const [cardImageIndexes, setCardImageIndexes] = useState<Record<PriceTier, number>>({
		Low: 0,
		Medium: 0,
		High: 0,
	});
	const [fullscreenModal, setFullscreenModal] = useState<{
		images: string[];
		index: number;
		zoomed: boolean;
		title: string;
	} | null>(null);
	const [shareStatus, setShareStatus] = useState<string>('');

	const catalog = useMemo(() => {
		if (initialItems && initialItems.length > 0) {
			return initialItems;
		}
		return buildExtraCatalog(activeBudget);
	}, [initialItems, activeBudget]);

	const [currentSet, setCurrentSet] = useState<Record<PriceTier, YasChatDiscoveryItem | null>>(() =>
		pickUniqueBrandByTier(buildExtraCatalog(defaultBudget), new Set()),
	);

	useEffect(() => {
		const nextSet = pickUniqueBrandByTier(catalog, usedBrands);
		setCurrentSet(nextSet);
	}, [catalog, usedBrands]);

	useEffect(() => {
		if (!fullscreenModal) {
			return;
		}
		const handlePopState = () => {
			setFullscreenModal(null);
		};
		window.history.pushState({ yaschatPhotoModal: true }, '');
		window.addEventListener('popstate', handlePopState);
		return (
  const [yasUsername, setYasUsername] = React.useState<string>("aasan_das");
  const [usernameInput, setUsernameInput] = React.useState<string>("aasan_das");
  const [usernameStatus, setUsernameStatus] = React.useState<string>("Active handle: @aasan_das");
  const [termsAccepted, setTermsAccepted] = React.useState<boolean>(false);
  const [privacyReviewed, setPrivacyReviewed] = React.useState<boolean>(false);
  const [contactMsg, setContactMsg] = React.useState<string>("");
  const [contactSent, setContactSent] = React.useState<string>("Support: support@yaschat.app");
  const [yasThemeMode, setYasThemeMode] = React.useState<string>("Dark");
  const [notifEnabled, setNotifEnabled] = React.useState<boolean>(true);
  const [loginId, setLoginId] = React.useState<string>("");
  const [loginStatus, setLoginStatus] = React.useState<string>("Ready to sign in");
  const [loggedOutMsg, setLoggedOutMsg] = React.useState<string>("Session active");
  const [payMethod, setPayMethod] = React.useState<string>("UPI / Card");
  const [activeMenu39Item, setActiveMenu39Item] = React.useState<string>("Email Address");
  const [activeFooterTab, setActiveFooterTab] = React.useState<"Home" | "Chats" | "Community" | "Discover" | "Profile">("Home");
  const footerItems: Array<{ id: "Home" | "Chats" | "Community" | "Discover" | "Profile"; icon: string; label: string; note: string }> = [{ id: "Home", icon: "🏠", label: "Home", note: "Home active" }, { id: "Chats", icon: "💬", label: "Chats", note: "Chats active" }, { id: "Community", icon: "👥", label: "Community", note: "Community active" }, { id: "Discover", icon: "🔍", label: "Discover", note: "Discover active" }, { id: "Profile", icon: "👤", label: "Profile", note: "Profile active" }];
  const currentFooter = footerItems.find((item) => item.id === activeFooterTab) || footerItems[0];
  
    <>{
      /* YasChat Top Header Start */
    }
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", marginBottom: "12px", borderRadius: "10px", backgroundColor: "rgba(15, 23, 42, 0.88)", border: "1px solid rgba(148, 163, 184, 0.45)", color: "#F8FAFC" }}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "999px", backgroundColor: "#FFFFFF", color: "#0F172A", fontSize: "15px" }}>🐟</span><strong style={{ fontSize: "15px", letterSpacing: "0.6px", color: "#FFFFFF" }}>YAS CHAT</strong></div><span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "999px", backgroundColor: "rgba(255, 255, 255, 0.14)", color: "#F8FAFC", border: "1px solid rgba(255, 255, 255, 0.28)" }}>Header Ready</span><span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "999px", backgroundColor: "rgba(15, 23, 42, 0.9)", color: "#FFFFFF", border: "1px solid rgba(148, 163, 184, 0.5)", marginLeft: "6px" }}>3.1</span></div>
    <div style={{ marginBottom: "12px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "rgba(15, 23, 42, 0.88)", border: "1px solid rgba(148, 163, 184, 0.45)", color: "#FFFFFF" }}><div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}><img src="/avatar/user-photo.jpg" alt="User Photo" style={{ width: "38px", height: "38px", borderRadius: "999px", objectFit: "cover", border: "1px solid rgba(255, 255, 255, 0.35)" }} /><div><div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>User Name</div><div style={{ fontSize: "11px", color: "#E2E8F0" }}>user@example.com</div></div><span style={{ marginLeft: "auto", fontSize: "11px", padding: "2px 8px", borderRadius: "999px", backgroundColor: "rgba(255, 255, 255, 0.14)", color: "#FFFFFF" }}>3.9</span></div><div style={{ display: "flex", flexWrap: "wrap", gap: "6px", fontSize: "11px" }}>{["Email Address", "Username", "Terms & Conditions", "Privacy Policy", "Contact Us", "About Us", "Theme", "Settings", "Login", "Logout", "Leaderboard", "Payment Gateway", "Analytics Dashboard"].map((item) => <button type="button" key={item} onClick={() => setActiveMenu39Item(item)} style={{ padding: "4px 8px", borderRadius: "8px", backgroundColor: activeMenu39Item === item ? "#2563EB" : "rgba(30, 41, 59, 0.95)", color: "#FFFFFF", border: "1px solid rgba(148, 163, 184, 0.45)", cursor: "pointer" }}>{item}</button>)}</div>
      <div style={{ marginTop: "6px", fontSize: "11px", color: "#FFFFFF" }}>Selected: {activeMenu39Item}</div>
      {activeMenu39Item === "Analytics Dashboard" && (<div style={{ marginTop: "6px", padding: "8px 10px", borderRadius: "8px", backgroundColor: "rgba(30, 41, 59, 0.92)", border: "1px solid rgba(147, 197, 253, 0.5)", color: "#FFFFFF", fontSize: "11px" }}><div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>Analytics Dashboard</div><div style={{ color: "#E2E8F0" }}>Views: Active • Engagement: Steady • Reach: Growing</div></div>)}
      {activeMenu39Item === "Leaderboard" && (<div style={{ marginTop: "6px", padding: "8px 10px", borderRadius: "8px", backgroundColor: "rgba(30, 41, 59, 0.92)", border: "1px solid rgba(147, 197, 253, 0.5)", color: "#FFFFFF", fontSize: "11px" }}><div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>Leaderboard</div><div style={{ color: "#E2E8F0" }}>#1 Top Creator • #2 Active Helper • #3 Rising Explorer</div></div>)}
      {activeMenu39Item === "About Us" && (<div style={{ marginTop: "6px", padding: "8px 10px", borderRadius: "8px", backgroundColor: "rgba(30, 41, 59, 0.92)", border: "1px solid rgba(147, 197, 253, 0.5)", color: "#FFFFFF", fontSize: "11px" }}><div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>About Us</div><div style={{ color: "#E2E8F0" }}>YAS CHAT brings real-time conversations, community discovery, and curated products together in one clean space.</div></div>)}
      {activeMenu39Item === "Email Address" && (<div style={{ marginTop: "6px", padding: "8px 10px", borderRadius: "8px", backgroundColor: "rgba(30, 41, 59, 0.92)", border: "1px solid rgba(147, 197, 253, 0.5)", color: "#FFFFFF", fontSize: "11px" }}><div style={{ fontWeight: 700, color: "#FFFFFF" }}>Email Address</div><div style={{ color: "#E2E8F0" }}>Registered email: user@example.com (Verified)</div></div>)}</div>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", marginBottom: "12px", borderRadius: "10px", backgroundColor: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(148, 163, 184, 0.45)" }}><input type="text" placeholder="Search anything..." aria-label="Search anything" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#FFFFFF", fontSize: "13px" }} /><span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(255, 255, 255, 0.14)", color: "#F8FAFC" }}>Search</span></div>
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}><button type="button" onClick={(e) => { const inp = e.currentTarget.parentElement?.previousElementSibling?.querySelector("input"); if (inp) { inp.value = ""; inp.focus(); } }} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "8px", backgroundColor: "rgba(15, 23, 42, 0.85)", color: "#FFFFFF", border: "1px solid rgba(148, 163, 184, 0.45)", cursor: "pointer" }}>Clear</button><span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "999px", backgroundColor: "rgba(15, 23, 42, 0.85)", color: "#F8FAFC", border: "1px solid rgba(148, 163, 184, 0.45)" }}>200+ Lang</span></div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "12px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "rgba(15, 23, 42, 0.88)", border: "1px solid rgba(148, 163, 184, 0.45)", color: "#FFFFFF" }}>{["Your Story", "Global", "Products", "Community", "More"].map((label) => (<div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "54px" }}><span style={{ width: "36px", height: "36px", borderRadius: "999px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, backgroundColor: "rgba(30, 41, 59, 0.95)", color: "#FFFFFF", border: "1px solid rgba(148, 163, 184, 0.5)" }}>{label[0]}</span><span style={{ fontSize: "11px", color: "#F8FAFC" }}>{label}</span></div>))}</div>
    <div style={{ marginBottom: "12px", padding: "12px", borderRadius: "10px", backgroundColor: "rgba(15, 23, 42, 0.88)", border: "1px solid rgba(148, 163, 184, 0.45)", color: "#FFFFFF" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "30px", height: "30px", borderRadius: "999px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, backgroundColor: "rgba(30, 41, 59, 0.95)", color: "#FFFFFF", border: "1px solid rgba(148, 163, 184, 0.5)" }}>YC</span><div><div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>YAS Community</div><div style={{ fontSize: "11px", color: "#E2E8F0" }}>2h ago</div></div></div><span style={{ fontSize: "14px", color: "#E2E8F0" }}>•••</span></div><div style={{ fontSize: "13px", color: "#F8FAFC", marginBottom: "10px" }}>बेहतर जीवन के लिए ज्ञान साझा करें...</div><div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px", color: "#E2E8F0" }}><span>♥ 12K</span><span>💬 732</span><span>↗ 120</span></div></div>
    <div style={{ marginBottom: "12px", padding: "12px", borderRadius: "10px", backgroundColor: "rgba(15, 23, 42, 0.88)", border: "1px solid rgba(148, 163, 184, 0.45)", color: "#FFFFFF" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>Trending Products</span><span style={{ fontSize: "12px", color: "#93C5FD" }}>See All &gt;</span></div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}><div><div style={{ fontSize: "13px", fontWeight: 600, color: "#F8FAFC" }}>Wireless Headphones</div><div style={{ fontSize: "12px", color: "#E2E8F0" }}>9.99 • ★ 4.5 ★ (12k)</div></div><span style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, backgroundColor: "#2563EB", color: "#FFFFFF" }}>Shop Now</span></div></div>
    <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "12px", backgroundColor: "rgba(15, 23, 42, 0.94)", border: "1px solid rgba(148, 163, 184, 0.45)", color: "#FFFFFF" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>{footerItems.map((item) => { const isActive = activeFooterTab === item.id; return (<button key={item.id} type="button" onClick={() => setActiveFooterTab(item.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "6px 4px", borderRadius: "8px", fontSize: "11px", fontWeight: isActive ? 700 : 500, backgroundColor: isActive ? "#2563EB" : "rgba(30, 41, 59, 0.85)", color: "#FFFFFF", border: isActive ? "1px solid #93C5FD" : "1px solid rgba(148, 163, 184, 0.35)", cursor: "pointer" }}>{item.id === "Profile" ? (<img src="/avatar/user-photo.jpg" alt="Profile" style={{ width: "22px", height: "22px", borderRadius: "999px", objectFit: "cover", border: "1px solid #FFFFFF" }} />) : (<span>{item.icon}</span>)}<span>{item.label}</span></button>); })}</div>{activeFooterTab === "Home" && (<div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "rgba(30, 41, 59, 0.92)", border: "1px solid rgba(147, 197, 253, 0.5)", color: "#FFFFFF", fontSize: "12px" }}><div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>Home — Discovery Overview</div><div style={{ color: "#E2E8F0" }}>Search, Story, Community &amp; Trending Products active on Home.</div></div>)}
      {activeFooterTab === "Chats" && (<div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "rgba(30, 41, 59, 0.92)", border: "1px solid rgba(147, 197, 253, 0.5)", color: "#FFFFFF", fontSize: "12px" }}><div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>Chats</div><div style={{ color: "#E2E8F0" }}>Recent chats &amp; new message.</div></div>)}
      {activeFooterTab === "Community" && (<div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "rgba(30, 41, 59, 0.92)", border: "1px solid rgba(147, 197, 253, 0.5)", color: "#FFFFFF", fontSize: "12px" }}><div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>Community</div><div style={{ color: "#E2E8F0" }}>Community posts &amp; discussion.</div></div>)}
      {activeFooterTab === "Discover" && (<div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "rgba(30, 41, 59, 0.92)", border: "1px solid rgba(147, 197, 253, 0.5)", color: "#FFFFFF", fontSize: "12px" }}><div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>Discover</div><div style={{ color: "#E2E8F0" }}>Trending items &amp; categories.</div></div>)}
      {activeFooterTab === "Profile" && (<div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "rgba(30, 41, 59, 0.92)", border: "1px solid rgba(147, 197, 253, 0.5)", color: "#FFFFFF", fontSize: "12px" }}><div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>Profile &amp; Menu 3.9</div><div style={{ color: "#E2E8F0" }}>Account details &amp; menu access.</div></div>)}
      <div style={{ marginTop: "8px", fontSize: "11px", color: "#E2E8F0" }}>Active Footer: <strong style={{ color: "#FFFFFF" }}>{currentFooter.label}</strong> — {currentFooter.note}</div></div>
    
    ) => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, [fullscreenModal]);

	const closeFullscreen = () => {
		setFullscreenModal(null);
	};

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const parsedBudget = extractBudgetFromQuery(query);
		const target = parsedBudget || defaultBudget;
		setActiveBudget(target);
		setUsedBrands(new Set());
		setHistoryStack([]);
		setCardImageIndexes({ Low: 0, Medium: 0, High: 0 });
		const freshCatalog = initialItems && initialItems.length > 0 ? initialItems : buildExtraCatalog(target);
		setCurrentSet(pickUniqueBrandByTier(freshCatalog, new Set()));
		const detectedCategory = extractCategoryFromQuery(query);
		setShareStatus(`खोज: "${detectedCategory}" | लक्ष्य बजट: ₹${target}`);
	};

	const handleVoiceSearch = () => {
		const SpeechRec =
			(window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
				.SpeechRecognition ||
			(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

		if (!SpeechRec) {
			setShareStatus('इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है, कृपया टाइप करें।');
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const recognition = new (SpeechRec as any)();
		recognition.interimResults = false;
		recognition.maxAlternatives = 1;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		recognition.onresult = (event: any) => {
			const spoken = event?.results?.[0]?.[0]?.transcript || '';
			if (spoken) {
				setQuery(spoken);
				const parsedBudget = extractBudgetFromQuery(spoken);
				if (parsedBudget) {
					setActiveBudget(parsedBudget);
				}
				setUsedBrands(new Set());
				setShareStatus(`वॉइस सर्च: "${spoken}"`);
			}
		};
		recognition.start();
	};

	const handleNextAll = () => {
		setHistoryStack((prev) => [...prev, currentSet]);
		const nextUsed = new Set(usedBrands);
		const nextRound = unlimitedRound + 1;
		setUnlimitedRound(nextRound);
		const extraUnlimited = buildUnlimitedDiscoveryItems(query, activeBudget, nextRound + viewerSessionSeed);
		TIER_ORDER.forEach((tier) => {
			const item = currentSet[tier];
			if (item) {
				nextUsed.add(item.brand.toLowerCase());
			}
		});
		const nextSet = pickUniqueBrandByTier(catalog, nextUsed);
		const allSameAsCurrent = TIER_ORDER.every(
			(tier) => nextSet[tier]?.id === currentSet[tier]?.id,
		);
		if (allSameAsCurrent) {
			const resetUsed = new Set<string>();
			TIER_ORDER.forEach((tier) => {
				const item = currentSet[tier];
				if (item) {
					resetUsed.add(item.brand.toLowerCase());
				}
			});
			setUsedBrands(resetUsed);
			setCurrentSet(pickUniqueBrandByTier(catalog, resetUsed));
		} else {
			setUsedBrands(nextUsed);
			setCurrentSet(nextSet);
		}
		setCardImageIndexes({ Low: 0, Medium: 0, High: 0 });
	};

	const handleNextSingleTier = (tier: PriceTier) => {
		setHistoryStack((prev) => [...prev, currentSet]);
		const currentItem = currentSet[tier];
		const nextUsed = new Set(usedBrands);
		if (currentItem) {
			nextUsed.add(currentItem.brand.toLowerCase());
		}
		const tierCandidates = catalog.filter((item) => item.isValid && item.priceTier === tier);
		const fresh =
			tierCandidates.find((item) => !nextUsed.has(item.brand.toLowerCase())) ||
			tierCandidates.find((item) => item.id !== currentItem?.id) ||
			currentItem;

		setUsedBrands(nextUsed);
		setCurrentSet((prev) => ({ ...prev, [tier]: fresh || null }));
		setCardImageIndexes((prev) => ({ ...prev, [tier]: 0 }));
	};

	const handleBack = () => {
		if (historyStack.length === 0) {
			return;
		}
		const previous = historyStack[historyStack.length - 1];
		setHistoryStack((prev) => prev.slice(0, -1));
		setCurrentSet(previous);
	};

	const copyShareText = async (text: string, label: string) => {
		try {
			if (navigator.share) {
				await navigator.share({ title: 'YasChat Product Discovery', text });
				setShareStatus(`${label} शेयर किया गया।`);
				return;
			}
		} catch {
			// Fallback to clipboard
		}
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
		}
		setShareStatus(`${label} कॉपी/शेयर के लिए तैयार है।`);
	};

	const handleShareSingle = (item: YasChatDiscoveryItem) => {
		const text = `${item.priceTier}: ${item.title} (${item.brand}) - ${item.currency}${item.price}\nLink: ${item.buyUrl}`;
		copyShareText(text, item.title);
	};

	const handleShareAllThree = () => {
		const lines = TIER_ORDER.map((tier) => {
			const item = currentSet[tier];
			if (!item) {
				return null;
			}
			return `[${tier}] ${item.title} (${item.brand}) - ${item.currency}${item.price} -> ${item.buyUrl}`;
		}).filter(Boolean);
		copyShareText(lines.join('\n\n'), 'तीनों (Low, Medium, High) प्रोडक्ट्स');
	};

	return (
		<div style={{ padding: '12px', maxWidth: '820px', margin: '0 auto', fontFamily: 'sans-serif' }}>
			<form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
				<input
					type='text'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder='किसी भी भाषा/बोलि में खोजें (जैसे: 10000 mobile phone)'
					style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #888' }}
				/>
				<button type='button' onClick={handleVoiceSearch} style={{ padding: '10px 12px', borderRadius: '8px' }}>
					🎤
				</button>
				<button type='submit' style={{ padding: '10px 14px', borderRadius: '8px' }}>
					खोजें
				</button>
			</form>

			<div style={{ background: "linear-gradient(180deg, #0b1633 0%, #091126 100%)", borderRadius: "16px", padding: "12px", marginBottom: "14px", border: "1px solid #1e3a8a", color: "#ffffff" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px", fontWeight: 700, fontSize: "18px" }}><span style={{ color: "#38bdf8" }}>🐟</span><span>YAS CHAT</span><span style={{ fontSize: "11px", opacity: 0.85 }}>Active: {(typeof window !== "undefined" && window.localStorage && window.localStorage.getItem("yaschat_price_tier")) || "All"}</span><button type="button" onClick={() => { if (typeof window !== "undefined" && window.localStorage) window.localStorage.setItem("yaschat_price_tier", "All"); }} style={{ marginLeft: "6px", fontSize: "10px" }}>Reset</button><button type="button" onClick={() => { const inp = document.querySelector("input[placeholder="Search product..."]") as HTMLInputElement | null; if (inp) inp.value = ""; if (typeof window !== "undefined" && window.localStorage) window.localStorage.setItem("yaschat_price_tier", "All"); }} style={{ marginLeft: "6px", fontSize: "10px" }}>Reset All</button><span style={{ marginLeft: "6px", fontSize: "10px" }}>Tier Filter: {(typeof window !== "undefined" && (window as any).__tier) ? (window as any).__tier : "All"}</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Search Query: {(typeof window !== "undefined" && (window as any).__q) ? (window as any).__q : "All"}</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Catalog Mode: Ready</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Filter Status: Ready</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Discovery Ready</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Shop Now</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Affiliate Ready</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Catalog Active</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Ready to Explore</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Trending Products</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>See All</span><span style={{ marginLeft: "6px", fontSize: "10px" }}>Discovery Ready</span><button type="button" onClick={() => { const inp = document.querySelector("input[placeholder*="Search"]") as HTMLInputElement | null; if (inp) { inp.value = ""; inp.dispatchEvent(new Event("input", { bubbles: true })); } }} style={{ marginLeft: "4px", fontSize: "10px" }}>Clear Box</button><span style={{ marginLeft: "8px", fontSize: "10px", opacity: 0.85 }}>Filter: {__q || "*"} / {__tier}</span></div><div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px" }}>{YASCHAT_STORY_CIRCLES.map((item) => (<button key={item.label} type="button" onClick={() => setQuery(item.query)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "transparent", border: "none", color: "#e2e8f0", cursor: "pointer", minWidth: "58px" }}><span style={{ width: "44px", height: "44px", borderRadius: "999px", border: "2px solid " + item.ring, display: "flex", alignItems: "center", justifyContent: "center", background: "#111c3a", fontSize: "11px", fontWeight: 700 }}>{item.label.slice(0, 2)}</span><span style={{ fontSize: "11px", whiteSpace: "nowrap" }}>{item.label}</span></button>))}</div><div style={{ background: "#101d3f", borderRadius: "12px", padding: "10px", marginBottom: "12px", border: "1px solid #1d4ed8" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}><div><div style={{ fontWeight: 700, fontSize: "13px" }}>YAS Community</div><div style={{ fontSize: "11px", color: "#93c5fd" }}>2h ago</div></div><span style={{ fontSize: "14px", color: "#94a3b8" }}>•••</span></div><div style={{ fontSize: "13px", marginBottom: "8px" }}>बेहतर जीवन के लिए ज्ञान साझा करें...</div><div style={{ background: "linear-gradient(135deg, #1d4ed8, #0ea5e9)", borderRadius: "10px", padding: "16px 12px", textAlign: "center", fontWeight: 600, fontSize: "13px", marginBottom: "8px" }}>🏔️ ✨ 🌊</div><div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#cbd5e1" }}><span>❤️ 12K</span><span>💬 732</span><span>↪️ 120</span></div></div><div style={{ background: "#101d3f", borderRadius: "12px", padding: "10px", marginBottom: "10px", border: "1px solid #1d4ed8" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}><span style={{ fontWeight: 700, fontSize: "14px" }}>Trending Products</span><button type="button" onClick={() => setQuery("trending products")} style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "12px", cursor: "pointer" }}>See All &gt;</button></div><div style={{ display: "flex", gap: "10px", alignItems: "center" }}><div style={{ width: "64px", height: "64px", borderRadius: "10px", background: "#172554", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🎧</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: "13px" }}>Wireless Headphones</div><div style={{ fontSize: "12px", color: "#93c5fd" }}>$59.99</div><div style={{ fontSize: "11px", color: "#facc15" }}>★ 4.5 ★ (12k)</div><button type="button" onClick={() => setQuery("wireless headphones")} style={{ marginTop: "6px", padding: "5px 10px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Shop Now</button></div></div></div><div style={{ margin: "8px 12px", padding: "10px", borderRadius: "10px", border: "1px dashed #38bdf8", background: "#0b152b", fontSize: "11px", color: "#f8fafc" }}><div>Sponsored · AdminFeed | Referral: YASH30 (30%)</div></div><div style={{ margin: "8px 12px", padding: "10px", borderRadius: "10px", background: "#101d3f", fontSize: "11px", color: "#f8fafc" }}><div>Voice &amp; Video Calling · WebRTC Ready</div></div><div style={{ margin: "8px 12px", padding: "10px", borderRadius: "10px", background: "#0b152b", border: "1px solid #1e3a8a", fontSize: "11px", color: "#cbd5e1" }}><div>Admin &amp; Security · Role Guard &amp; Safe Fallback</div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", paddingTop: "8px", borderTop: "1px solid #1e3a8a", textAlign: "center", fontSize: "10px" }}>{[{ key: "Home", icon: "🏠", q: "trending products" },{ key: "Chats", icon: "💬", q: "chat community" },{ key: "Community", icon: "👥", q: "community discussion" },{ key: "Discover", icon: "🔍", q: "best smartphone under 15000" },{ key: "Profile", icon: "👤", q: "earning wallet" }].map((tab) => (<button key={tab.key} type="button" onClick={() => { setActiveNav(tab.key); setQuery(tab.q); }} style={{ background: activeNav === tab.key ? "#1d4ed8" : "transparent", border: "none", borderRadius: "8px", padding: "4px 2px", color: activeNav === tab.key ? "#ffffff" : "#cbd5e1", fontWeight: activeNav === tab.key ? 700 : 400, cursor: "pointer", fontSize: "10px" }}>{tab.icon} {tab.key}</button>))}</div></div>
        <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.85 }}>Recent Search: {(typeof window !== "undefined" && window.localStorage && JSON.parse(window.localStorage.getItem("yaschat_search_history") || "[]").join(", ")) || "None"} <button type="button" onClick={() => { if (typeof window !== "undefined" && window.localStorage) { const raw = window.localStorage.getItem("yaschat_search_history") || "[]"; const list = JSON.parse(raw); const first = Array.isArray(list) && list[0] ? String(list[0]) : ""; const inp = document.querySelector("input[placeholder="Search product..."]") as HTMLInputElement | null; if (inp && first) { inp.value = first; inp.focus(); } } }} style={{ marginLeft: "6px", fontSize: "10px" }}>Use Last</button><button type="button" onClick={() => { if (typeof window !== "undefined" && window.localStorage) window.localStorage.removeItem("yaschat_search_history"); }} style={{ marginLeft: "6px", fontSize: "10px" }}>Clear</button></div>
        <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}><input type="text" placeholder="Search product..." onKeyDown={(e) => { if (e.key === "Enter") { const v = (e.currentTarget.value || "").trim(); if (v && typeof window !== "undefined" && window.localStorage) { const prev = JSON.parse(window.localStorage.getItem("yaschat_search_history") || "[]"); const next = [v, ...prev.filter((x: string) => x !== v)].slice(0, 5); window.localStorage.setItem("yaschat_search_history", JSON.stringify(next)); } } }} onChange={(e) => { const v = e.target.value.trim(); if (v && typeof window !== "undefined" && window.localStorage) { const prev = JSON.parse(window.localStorage.getItem("yaschat_search_history") || "[]"); const next = [v, ...prev.filter((x: string) => x !== v)].slice(0, 5); window.localStorage.setItem("yaschat_search_history", JSON.stringify(next)); } }}  /><button type="button" onClick={() => { const inp = document.querySelector("input[placeholder="Search product..."]") as HTMLInputElement | null; if (inp) { inp.value = ""; inp.focus(); } }} style={{ marginLeft: "4px", fontSize: "11px" }}>×</button><span style={{ display: "inline-flex", gap: "4px", fontSize: "11px" }}>{["All", "Low", "Medium", "High"].map((t) => <button key={t} type="button" onClick={() => { if (typeof window !== "undefined" && window.localStorage) window.localStorage.setItem("yaschat_price_tier", t); }} style={{ fontWeight: (typeof window !== "undefined" && window.localStorage && window.localStorage.getItem("yaschat_price_tier") === t) ? "bold" : "normal" }}>{t}</button>)}</span></div>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
				<button type='button' onClick={handleBack} disabled={historyStack.length === 0} style={{ padding: '8px 12px' }}>
					← Back
				</button>
				<button type='button' onClick={handleNextAll} style={{ padding: '8px 12px' }}>
					Next All 3 (नई कंपनियां) →
				</button>
				<button type='button' onClick={handleShareAllThree} style={{ padding: '8px 12px' }}>
					Share All 3
				</button>
			</div>

			{shareStatus ? (
				<div style={{ marginBottom: '12px', fontSize: '13px', opacity: 0.9 }}>{shareStatus}</div>
			) : null}

			<div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
				{TIER_ORDER.map((tier) => {
					const item = currentSet[tier];
					if (!item) {
						return null;
					}
					const imgIdx = cardImageIndexes[tier] || 0;
					const currentImg = item.images[imgIdx] || item.images[0];

					const __q = (typeof window !== "undefined" && window.document) ? (((document.querySelector("input[placeholder="Search product..."]") as HTMLInputElement | null)?.value || "").trim().toLowerCase()) : ""; const __tier = (typeof window !== "undefined" && window.localStorage) ? (window.localStorage.getItem("yaschat_price_tier") || "All") : "All"; void __q; void __tier; const __matchItem = (label: string, itemTier = "All") => { const t = String(__tier || ""); const q = String(__q || ""); const okTier = t === "" || t === "All" || String(itemTier).toLowerCase() === t.toLowerCase(); const okQ = q === "" || String(label || "").toLowerCase().includes(q); return okTier && okQ; }; void __matchItem;
	return (
						<div
							key={`${tier}-${item.id}`}
							style={{
								border: '1px solid #666',
								borderRadius: '10px',
								padding: '12px',
							}}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
								<strong>
									{tier} Range — {item.brand} ({item.title})
								</strong>
								<span>
									{item.currency}
									{item.price}
								</span>
							</div>

							<div style={{ fontSize: '13px', marginBottom: '8px' }}>{item.tierAudience}</div>

							<div style={{ marginBottom: '10px' }}>
								<img
									src={currentImg}
									alt={`${item.title} ${imgIdx + 1}`}
									onClick={() =>
										setFullscreenModal({
											images: item.images,
											index: imgIdx,
											zoomed: false,
											title: item.title,
										})
									}
									style={{
										width: '100%',
										maxHeight: '240px',
										objectFit: 'cover',
										borderRadius: '8px',
										cursor: 'zoom-in',
									}}
								/>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
									<button
										type='button'
										onClick={() =>
											setCardImageIndexes((prev) => ({
												...prev,
												[tier]: (imgIdx - 1 + item.images.length) % item.images.length,
											}))
										}
									>
										◀ Prev Img
									</button>
        <div style={{ marginTop: "8px", fontSize: "12px" }}><div><strong>{item.title}</strong>{item.price ? " — " + item.price : ""}</div><div>Pros: {item.pros || "Good value"} | Cons: {item.cons || "Check details"}</div>{item.shopUrl ? <a href={item.shopUrl} target="_blank" rel="noreferrer">Shop Now</a><button type="button" onClick={() => { const u = String("" || ""); if (u === "") return; if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(u).catch(() => {}); } }} style={{ marginLeft: "6px", fontSize: "10px" }} onMouseDown={(e) => { const a = document.querySelector("a[href*="http"]") as HTMLAnchorElement | null; const u = a && a.href ? a.href : ""; if (u !== "" && typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(u).catch(() => {}); } const el = e.currentTarget; el.textContent = "Copied"; setTimeout(() => { if (el) el.textContent = "Copy"; }, 1200); }}>Copy</button><button type="button" onClick={() => { const u = String("" || ""); if (u === "") return; if (typeof navigator !== "undefined" && typeof navigator.share === "function") { navigator.share({ url: u }).catch(() => {}); } else if (typeof window !== "undefined") { window.open("https://wa.me/?text=" + encodeURIComponent(u), "_blank", "noopener,noreferrer"); } }} style={{ marginLeft: "4px", fontSize: "10px" }} onMouseDown={(e) => { const a = document.querySelector("a[href*="http"]") as HTMLAnchorElement | null; const u = a && a.href ? a.href : ""; if (u !== "" && typeof navigator !== "undefined") { if (navigator.share) { navigator.share({ url: u }).catch(() => {}); } else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(u).catch(() => {}); } } const el = e.currentTarget; el.textContent = "Shared"; setTimeout(() => { if (el) el.textContent = "Share"; }, 1200); }}>Share</button><button type="button" onClick={() => { const a = document.querySelector("a[href*="http"]") as HTMLAnchorElement | null; const u = a && a.href ? a.href : ""; if (u !== "" && typeof window !== "undefined") { window.open(u, "_blank", "noopener,noreferrer"); } }} style={{ marginLeft: "4px", fontSize: "10px" }}>Open</button><button type="button" onClick={() => { const inp = document.querySelector("input[placeholder*="Search"]") as HTMLInputElement | null; const last = typeof window !== "undefined" && window.localStorage ? (window.localStorage.getItem("yaschat_last_search") || "") : ""; if (inp && last !== "") { inp.value = last; inp.dispatchEvent(new Event("input", { bubbles: true })); } }} style={{ marginLeft: "4px", fontSize: "10px" }}>Refill</button><button type="button" onClick={(e) => { const inp = document.querySelector("input[placeholder*="Search"]") as HTMLInputElement | null; const val = inp && inp.value ? inp.value.trim() : ""; if (val !== "" && typeof window !== "undefined" && window.localStorage) { window.localStorage.setItem("yaschat_last_search", val); const el = e.currentTarget; el.textContent = "Saved"; setTimeout(() => { if (el) el.textContent = "Save"; }, 1200); } }} style={{ marginLeft: "4px", fontSize: "10px" }}>Save</button><button type="button" onClick={(e) => { if (typeof window !== "undefined" && window.localStorage) { window.localStorage.removeItem("yaschat_last_search"); const el = e.currentTarget; el.textContent = "Cleared"; setTimeout(() => { if (el) el.textContent = "Clear Saved"; }, 1200); } }} style={{ marginLeft: "4px", fontSize: "10px" }}>Clear Saved</button> : null}</div>
        <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.85 }}>Recent Search: {(typeof window !== "undefined" && window.localStorage && JSON.parse(window.localStorage.getItem("yaschat_search_history") || "[]").join(", ")) || "None"}</div>
        <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}><input type="text" placeholder="Search product..." onChange={(e) => { const v = e.target.value.trim(); if (v && typeof window !== "undefined" && window.localStorage) { const prev = JSON.parse(window.localStorage.getItem("yaschat_search_history") || "[]"); const next = [v, ...prev.filter((x: string) => x !== v)].slice(0, 5); window.localStorage.setItem("yaschat_search_history", JSON.stringify(next)); } }} /><span style={{ fontSize: "11px" }}>Tier: All | Low | Medium | High</span></div>
									</button>
									<span style={{ fontSize: '12px' }}>
										Image {imgIdx + 1} / {item.images.length} (टच करके फुल-स्क्रीन)
									</span>
									<button
										type='button'
										onClick={() =>
											setCardImageIndexes((prev) => ({
												...prev,
												[tier]: (imgIdx + 1) % item.images.length,
											}))
										}
									>
										Next Img ▶
									</button>
								</div>
							</div>

							<div style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '10px' }}>
								<div>
									<strong>बैटरी:</strong> {item.metadata.batteryPower}
								</div>
								<div>
									<strong>चार्जर:</strong> {item.metadata.chargerType} | {item.metadata.chargerQuality}
								</div>
								<div>
									<strong>ईयरफोन:</strong> {item.metadata.earphoneDetails}
								</div>
								<div>
									<strong>Rear कैमरा:</strong> {item.metadata.rearCamera}
								</div>
								<div>
									<strong>Front कैमरा:</strong> {item.metadata.frontCamera}
								</div>
								<div>
									<strong>Gamer:</strong> {item.metadata.forGamer} | <strong>Daily:</strong> {item.metadata.forDailyUser} |{' '}
									<strong>Heavy:</strong> {item.metadata.forHeavyUser}
								</div>
							</div>

							{item.whatYouGet.length > 0 ? (
								<div style={{ fontSize: '13px', marginBottom: '6px' }}>
									<strong>क्या मिलेगा:</strong> {item.whatYouGet.join(' • ')}
								</div>
							) : null}

							{item.whatYouDontGet.length > 0 ? (
								<div style={{ fontSize: '13px', marginBottom: '6px' }}>
									<strong>क्या नहीं मिलेगा:</strong> {item.whatYouDontGet.join(' • ')}
								</div>
							) : null}

							{item.prosWhoShouldBuy.length > 0 ? (
								<div style={{ fontSize: '13px', marginBottom: '6px' }}>
									<strong>सही (किसके लिए लें):</strong> {item.prosWhoShouldBuy.join(' • ')}
								</div>
							) : null}

							{item.consWhoShouldAvoid.length > 0 ? (
								<div style={{ fontSize: '13px', marginBottom: '8px' }}>
									<strong>ग़लत (किसके लिए न लें):</strong> {item.consWhoShouldAvoid.join(' • ')}
								</div>
							) : null}

							{item.ratings.length > 0 ? (
								<div style={{ fontSize: '12px', marginBottom: '10px', opacity: 0.9 }}>
									<strong>रेटिंग / स्रोत:</strong>{' '}
									{item.ratings.map((r) => `${r.platform}: ${r.score} (${r.summary})`).join(' | ')}
								</div>
							) : null}

							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
								<a
									href={item.buyUrl}
									target='_blank'
									rel='noopener noreferrer'
									style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid currentColor', textDecoration: 'none' }}
								>
									Buy ({item.affiliateNetwork})
								</a>
								<button type='button' onClick={() => handleShareSingle(item)} style={{ padding: '8px 12px', borderRadius: '6px' }}>
									Share
								</button>
								<button
									type='button'
									onClick={() => handleNextSingleTier(tier)}
									style={{ padding: '8px 12px', borderRadius: '6px' }}
								>
									Next {tier} →
								</button>
							</div>
						</div>
					);
				})}
			</div>

			{fullscreenModal ? (
				<div
					onClick={closeFullscreen}
					style={{
						position: 'fixed',
						inset: 0,
						backgroundColor: 'rgba(0,0,0,0.92)',
						zIndex: 9999,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						padding: '14px',
						color: '#fff',
					}}
				>
					<div
						onClick={(e) => e.stopPropagation()}
						style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
					>
						<span>
							{fullscreenModal.title} ({fullscreenModal.index + 1}/{fullscreenModal.images.length})
						</span>
						<div style={{ display: 'flex', gap: '8px' }}>
							<button
								type='button'
								onClick={() =>
									setFullscreenModal((prev) => (prev ? { ...prev, zoomed: !prev.zoomed } : null))
								}
							>
								{fullscreenModal.zoomed ? 'Zoom Out (1x)' : 'Zoom (2x)'}
							</button>
							<button type='button' onClick={closeFullscreen}>
								✕ Back
							</button>
						</div>
					</div>

					<div
						onClick={(e) => e.stopPropagation()}
						style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}
					>
						<img
							src={fullscreenModal.images[fullscreenModal.index]}
							alt={fullscreenModal.title}
							onClick={() =>
								setFullscreenModal((prev) => (prev ? { ...prev, zoomed: !prev.zoomed } : null))
							}
							style={{
								maxWidth: fullscreenModal.zoomed ? '200%' : '100%',
								maxHeight: fullscreenModal.zoomed ? '200%' : '80vh',
								transform: fullscreenModal.zoomed ? 'scale(1.5)' : 'scale(1)',
								transition: 'transform 0.2s ease',
								objectFit: 'contain',
							}}
						/>
					</div>

					<div
						onClick={(e) => e.stopPropagation()}
						style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
					>
						<button
							type='button'
							onClick={() =>
								setFullscreenModal((prev) =>
									prev
										? {
												...prev,
												zoomed: false,
												index: (prev.index - 1 + prev.images.length) % prev.images.length,
										  }
										: null,
								)
							}
						>
							◀ पिछली इमेज
						</button>
						<button type='button' onClick={closeFullscreen}>
							वापस जाएं
						</button>
						<button
							type='button'
							onClick={() =>
								setFullscreenModal((prev) =>
									prev
										? {
												...prev,
												zoomed: false,
												index: (prev.index + 1) % prev.images.length,
										  }
										: null,
								)
							}
						>
							अगली इमेज ▶
						</button>
					</div>
				</div>
			) : null}
		</div>
	);
};

    </>