const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(process.env.DB_PATH || './data/clb.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ─────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'student',
    major       TEXT,
    year        INTEGER DEFAULT 1,
    avatar      TEXT    DEFAULT '/default-avatar.png',
    bio         TEXT,
    created_at  TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS clubs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,
    category     TEXT NOT NULL,
    short_desc   TEXT,
    description  TEXT,
    logo         TEXT DEFAULT '/default-club.png',
    banner       TEXT DEFAULT '/default-banner.jpg',
    founded_year INTEGER,
    member_count INTEGER DEFAULT 0,
    leader_id    INTEGER REFERENCES users(id),
    contact_email TEXT,
    contact_fb   TEXT,
    leader_fb    TEXT,
    activities   TEXT,
    departments  TEXT,
    is_featured  INTEGER DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS club_members (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id   INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      TEXT DEFAULT 'member',
    joined_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(club_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id     INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    start_time  TEXT,
    end_time    TEXT,
    location    TEXT,
    image       TEXT,
    status      TEXT DEFAULT 'upcoming',
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS event_registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(event_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id    INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id    INTEGER REFERENCES users(id),
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    major      TEXT,
    year       INTEGER,
    reason     TEXT,
    status     TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id    INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    author_id  INTEGER REFERENCES users(id),
    title      TEXT NOT NULL,
    content    TEXT,
    image      TEXT,
    type       TEXT DEFAULT 'news',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS chat_rooms (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    club_id    INTEGER REFERENCES clubs(id),
    status     TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id    INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id  INTEGER REFERENCES users(id),
    sender_name TEXT,
    content    TEXT NOT NULL,
    is_admin   INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    content    TEXT,
    type       TEXT DEFAULT 'general',
    is_read    INTEGER DEFAULT 0,
    ref_id     INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS saved_clubs (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id  INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    saved_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(user_id, club_id)
  );
`);

// ── Migrate: add new columns if not exist ──────────────────────────────────
['leader_fb', 'activities', 'departments'].forEach((col) => {
  try { db.exec(`ALTER TABLE clubs ADD COLUMN ${col} TEXT`); } catch {}
});

// ── Seed ───────────────────────────────────────────────────────────────────

const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (count === 0) {
  console.log('🌱 Seeding database...');

  const hash = (p) => bcrypt.hashSync(p, 10);

  // Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, major, year, bio)
    VALUES (@name, @email, @password, @role, @major, @year, @bio)
  `);

  const users = [
    { name: 'Admin FPT', email: 'admin@fpt.edu.vn', password: hash('admin123'), role: 'admin', major: 'Quản trị', year: 0, bio: 'Quản trị viên hệ thống CLB FPT Đà Nẵng' },
    { name: 'Nguyễn Minh Khôi', email: 'khoi.nm@fpt.edu.vn', password: hash('leader123'), role: 'leader', major: 'Công nghệ thông tin', year: 3, bio: 'Trưởng CLB Lập trình FPT Code' },
    { name: 'Trần Thị Thu Hà', email: 'ha.ttt@fpt.edu.vn', password: hash('leader123'), role: 'leader', major: 'Truyền thông đa phương tiện', year: 3, bio: 'Trưởng CLB FPT Media' },
    { name: 'Lê Văn Đức', email: 'duc.lv@fpt.edu.vn', password: hash('leader123'), role: 'leader', major: 'Marketing', year: 4, bio: 'Trưởng CLB English Plus' },
    { name: 'Phạm Hồng Anh', email: 'anh.ph@fpt.edu.vn', password: hash('user123'), role: 'student', major: 'Công nghệ thông tin', year: 2, bio: 'Sinh viên năm 2 ngành CNTT' },
    { name: 'Võ Thị Lan', email: 'lan.vt@fpt.edu.vn', password: hash('user123'), role: 'student', major: 'Kế toán', year: 1, bio: 'Sinh viên năm nhất, thích âm nhạc và thể thao' },
    { name: 'Hoàng Tuấn Anh', email: 'anh.ht@fpt.edu.vn', password: hash('user123'), role: 'student', major: 'Ngôn ngữ Anh', year: 2, bio: 'Yêu thích tiếng Anh và du lịch' },
  ];

  const userIds = {};
  users.forEach((u) => {
    const result = insertUser.run(u);
    userIds[u.email] = result.lastInsertRowid;
  });

  // Clubs
  const insertClub = db.prepare(`
    INSERT INTO clubs (name, slug, category, short_desc, description, founded_year, member_count, leader_id, contact_email, contact_fb, leader_fb, activities, departments, is_featured)
    VALUES (@name, @slug, @category, @short_desc, @description, @founded_year, @member_count, @leader_id, @contact_email, @contact_fb, @leader_fb, @activities, @departments, @is_featured)
  `);

  const clubs = [
    {
      name: 'F2K',
      slug: 'f2k',
      category: 'community',
      short_desc: 'FPT Kindness Krew – thiện nguyện, sẻ chia và trao gửi yêu thương',
      description: 'CLB F2K (FPT Kindness Krew) tại Đại học FPT Đà Nẵng là câu lạc bộ thiện nguyện nổi bật, chuyên tổ chức các hoạt động cộng đồng, sẻ chia và trao gửi yêu thương. Đây là một trong Top 5 CLB xuất sắc nhất tại Đại học FPT Đà Nẵng (kỳ Fall 2025) với tinh thần nhiệt huyết, năng động.\n\nTên đầy đủ: FPT Kindness Krew (CLB Thiện nguyện F2K).\nMục tiêu: Tổ chức các hoạt động tình nguyện, mang lại giá trị thiết thực cho cộng đồng, đặc biệt là giúp đỡ các hoàn cảnh khó khăn.\nThành tích: Được vinh danh trong Top 5 CLB xuất sắc nhất kỳ Fall 2025 tại FPTU Đà Nẵng.',
      activities: 'Tổ chức sự kiện văn hóa: F2K thường xuyên tham gia vào các sự kiện lớn của trường như "Hội Làng", tổ chức các gian hàng ẩm thực mang đậm bản sắc văn hóa và tạo sân chơi kết nối, chia sẻ năng lượng tích cực cho sinh viên.\n\nHoạt động thiện nguyện & Cộng đồng: Câu lạc bộ tập trung vào các chương trình thiện nguyện như quyên góp quần áo ấm cho trẻ em vùng cao, hỗ trợ cộng đồng khó khăn và lan tỏa tinh thần tử tế trong toàn trường.',
      departments: JSON.stringify([
        { name: 'Ban Nội dung & Sự kiện', desc: 'Chịu trách nhiệm lên ý tưởng, kịch bản và tổ chức các chương trình tình nguyện, hoạt động xã hội, hội làng và các chiến dịch lan tỏa sự tử tế.' },
        { name: 'Ban Truyền thông', desc: 'Quản lý fanpage, chụp ảnh, quay dựng video, thiết kế ấn phẩm truyền thông để lan tỏa hình ảnh và thông tin của các chương trình.' },
        { name: 'Ban Đối ngoại & Nhân sự', desc: 'Kết nối các thành viên, quản lý nhân sự, và tìm kiếm, làm việc với các nhà tài trợ hoặc đối tác cho các chương trình.' },
      ]),
      founded_year: 2019,
      member_count: 85,
      leader_id: userIds['khoi.nm@fpt.edu.vn'],
      contact_email: 'fpt.kindness.krew@gmail.com',
      contact_fb: 'https://www.facebook.com/share/18EzVZzzmE/?mibextid=wwXIfr',
      leader_fb: 'https://www.facebook.com/share/1CdzUgkPnK/?mibextid=wwXIfr',
      is_featured: 1,
    },
    {
      name: 'FCS',
      slug: 'fcs',
      category: 'sports',
      short_desc: 'CLB thể thao tổng hợp – rèn luyện thể lực, xây dựng tinh thần đồng đội',
      description: 'FCS (FPT Combat & Sports) là câu lạc bộ thể thao tổng hợp của FPT University Đà Nẵng. Chúng tôi hoạt động trong nhiều bộ môn thể thao, tổ chức các giải đấu nội bộ và giao lưu thể thao với các trường bạn. Môi trường lành mạnh, năng động giúp sinh viên rèn luyện sức khỏe và tinh thần.',
      founded_year: 2018,
      member_count: 112,
      leader_id: null,
      contact_email: 'fcs@fpt.edu.vn',
      contact_fb: 'https://fb.com/fcs.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 0,
    },
    {
      name: 'FDN Nunchaku',
      slug: 'fdn-nunchaku',
      category: 'sports',
      short_desc: 'Võ thuật côn nhị khúc – kỷ luật, tinh thần và nghệ thuật chiến đấu',
      description: 'FDN Nunchaku là câu lạc bộ võ thuật chuyên về côn nhị khúc (nunchaku) tại FPT University Đà Nẵng. Chúng tôi đào tạo kỹ thuật nunchaku từ cơ bản đến nâng cao, kết hợp biểu diễn nghệ thuật và thi đấu. CLB tham gia các giải võ thuật toàn quốc và thường xuyên biểu diễn tại các sự kiện trường.',
      founded_year: 2020,
      member_count: 48,
      leader_id: null,
      contact_email: 'fdn.nunchaku@fpt.edu.vn',
      contact_fb: 'https://fb.com/fdn.nunchaku.fpt',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 0,
    },
    {
      name: 'FENIOUS',
      slug: 'fenious',
      category: 'art',
      short_desc: 'Nghệ thuật biểu diễn – sân khấu là nhà, đam mê là động lực',
      description: 'FENIOUS là câu lạc bộ nghệ thuật biểu diễn đa năng của FPT University Đà Nẵng. Chúng tôi kết hợp múa, kịch, âm nhạc và các hình thức nghệ thuật đương đại để tạo nên những màn trình diễn ấn tượng. FENIOUS là nơi các tài năng nghệ thuật được phát hiện, nuôi dưỡng và tỏa sáng.',
      founded_year: 2019,
      member_count: 67,
      leader_id: userIds['ha.ttt@fpt.edu.vn'],
      contact_email: 'fenious@fpt.edu.vn',
      contact_fb: 'https://fb.com/fenious.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 1,
    },
    {
      name: 'FUM',
      slug: 'fum',
      category: 'art',
      short_desc: 'FPT University Music – âm nhạc là ngôn ngữ không biên giới',
      description: 'FUM (FPT University Music) là câu lạc bộ âm nhạc lớn nhất tại FPT University Đà Nẵng. Chúng tôi quy tụ sinh viên yêu âm nhạc từ nhiều thể loại: acoustic, pop, R&B, jazz và cả nhạc dân tộc. FUM tổ chức concert định kỳ, workshop nhạc lý, hòa âm phối khí và thi hát sinh viên.',
      founded_year: 2017,
      member_count: 143,
      leader_id: null,
      contact_email: 'fum@fpt.edu.vn',
      contact_fb: 'https://fb.com/fum.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 1,
    },
    {
      name: "MIC's Home",
      slug: 'mics-home',
      category: 'art',
      short_desc: 'Rap, MC & Hip-hop culture – nơi lời nói trở thành nghệ thuật',
      description: "MIC's Home là câu lạc bộ rap, MC và văn hoá hip-hop tại FPT University Đà Nẵng. Chúng tôi tạo không gian cho sinh viên sáng tác, luyện tập freestyle, beat-making và biểu diễn. MIC's Home thường xuyên tổ chức open-mic, rap battle và workshop với các nghệ sĩ underground.",
      founded_year: 2021,
      member_count: 54,
      leader_id: null,
      contact_email: 'micshome@fpt.edu.vn',
      contact_fb: "https://fb.com/micshome.fptdn",
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 0,
    },
    {
      name: 'Rhythm',
      slug: 'rhythm',
      category: 'art',
      short_desc: 'Vũ đạo hiện đại – cảm nhận nhịp điệu, sống trong từng bước nhảy',
      description: 'Rhythm là câu lạc bộ vũ đạo hiện đại của FPT University Đà Nẵng, chuyên về Contemporary, Jazz, K-pop cover và các phong cách dance fusion. Chúng tôi đào tạo từ người mới bắt đầu đến vũ công chuyên nghiệp, tham gia các cuộc thi vũ đạo toàn quốc và biểu diễn tại các sự kiện lớn.',
      founded_year: 2018,
      member_count: 96,
      leader_id: null,
      contact_email: 'rhythm@fpt.edu.vn',
      contact_fb: 'https://fb.com/rhythm.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 1,
    },
    {
      name: 'SRC',
      slug: 'src',
      category: 'academic',
      short_desc: 'Student Representative Council – tiếng nói của sinh viên FPT',
      description: 'SRC (Student Representative Council) là hội đại diện sinh viên của FPT University Đà Nẵng. Chúng tôi là cầu nối giữa sinh viên và nhà trường, tổ chức các hoạt động học thuật, sự kiện toàn trường và đại diện cho quyền lợi sinh viên. SRC tuyển chọn những sinh viên có năng lực lãnh đạo, nhiệt huyết và tinh thần trách nhiệm.',
      founded_year: 2016,
      member_count: 78,
      leader_id: userIds['duc.lv@fpt.edu.vn'],
      contact_email: 'src@fpt.edu.vn',
      contact_fb: 'https://fb.com/src.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 0,
    },
    {
      name: 'EVO',
      slug: 'evo',
      category: 'technology',
      short_desc: 'Esports & Gaming – đấu trường điện tử cho thế hệ FPT',
      description: 'EVO là câu lạc bộ esports và gaming của FPT University Đà Nẵng. Chúng tôi tổ chức các giải đấu game nội bộ và liên trường cho các tựa game như Valorant, League of Legends, PUBG Mobile và FIFA. EVO còn đào tạo kỹ năng stream, content gaming và phát triển cộng đồng game lành mạnh.',
      founded_year: 2020,
      member_count: 130,
      leader_id: userIds['khoi.nm@fpt.edu.vn'],
      contact_email: 'evo@fpt.edu.vn',
      contact_fb: 'https://fb.com/evo.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 1,
    },
    {
      name: 'FIC',
      slug: 'fic',
      category: 'media',
      short_desc: 'FPT Image & Cinema – sáng tạo hình ảnh, kể chuyện bằng ánh sáng',
      description: 'FIC (FPT Image & Cinema) là câu lạc bộ nhiếp ảnh và làm phim của FPT University Đà Nẵng. Chúng tôi đào tạo kỹ năng chụp ảnh, quay phim, dựng phim và hậu kỳ. FIC sản xuất phim ngắn, MV và tham gia các liên hoan phim sinh viên trong và ngoài nước.',
      founded_year: 2019,
      member_count: 72,
      leader_id: userIds['ha.ttt@fpt.edu.vn'],
      contact_email: 'fic@fpt.edu.vn',
      contact_fb: 'https://fb.com/fic.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 0,
    },
    {
      name: 'Resup',
      slug: 'resup',
      category: 'community',
      short_desc: 'Resource & Support – kết nối nguồn lực, hỗ trợ cộng đồng sinh viên',
      description: 'Resup là câu lạc bộ hỗ trợ cộng đồng và kết nối nguồn lực tại FPT University Đà Nẵng. Chúng tôi tổ chức các chương trình hỗ trợ tài liệu học tập, kết nối sinh viên với doanh nghiệp, tư vấn việc làm và các hoạt động thiện nguyện. Resup là nơi sinh viên giúp đỡ lẫn nhau để cùng phát triển.',
      founded_year: 2021,
      member_count: 61,
      leader_id: null,
      contact_email: 'resup@fpt.edu.vn',
      contact_fb: 'https://fb.com/resup.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 0,
    },
    {
      name: 'FCC',
      slug: 'fcc',
      category: 'academic',
      short_desc: 'FPT Competitive Club – thi đấu học thuật, chinh phục đỉnh cao',
      description: 'FCC (FPT Competitive Club) là câu lạc bộ thi đấu học thuật của FPT University Đà Nẵng. Chúng tôi đào tạo và tham gia các cuộc thi như ICPC, Olympic Tin học, Toán học, Vật lý sinh viên. FCC là cộng đồng của những sinh viên xuất sắc, yêu thích thử thách và chinh phục giới hạn bản thân.',
      founded_year: 2019,
      member_count: 55,
      leader_id: null,
      contact_email: 'fcc@fpt.edu.vn',
      contact_fb: 'https://fb.com/fcc.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 0,
    },
    {
      name: 'FUB Club',
      slug: 'fub-club',
      category: 'art',
      short_desc: 'FPT University Band – ban nhạc sinh viên, âm nhạc sống động',
      description: 'FUB Club (FPT University Band) là ban nhạc sinh viên của FPT University Đà Nẵng. Chúng tôi biểu diễn tại các sự kiện lớn của trường với đủ thể loại từ rock, pop đến ballad và EDM. FUB Club là nơi các nhạc công, ca sĩ sinh viên được tỏa sáng và cùng nhau tạo nên những màn trình diễn đáng nhớ.',
      founded_year: 2018,
      member_count: 68,
      leader_id: null,
      contact_email: 'fubclub@fpt.edu.vn',
      contact_fb: 'https://fb.com/fubclub.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 0,
    },
    {
      name: 'FVC Club',
      slug: 'fvc-club',
      category: 'sports',
      short_desc: 'FPT Volleyball Club – bóng chuyền đam mê, tinh thần đồng đội',
      description: 'FVC Club (FPT Volleyball Club) là câu lạc bộ bóng chuyền của FPT University Đà Nẵng. Chúng tôi tổ chức tập luyện thường xuyên, giải bóng chuyền nội bộ và tham gia các giải đấu sinh viên toàn thành phố. FVC Club chào đón tất cả sinh viên yêu thích bóng chuyền, từ người mới đến vận động viên có kinh nghiệm.',
      founded_year: 2017,
      member_count: 89,
      leader_id: null,
      contact_email: 'fvc@fpt.edu.vn',
      contact_fb: 'https://fb.com/fvc.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 0,
    },
    {
      name: 'NYS Club',
      slug: 'nys-club',
      category: 'media',
      short_desc: 'New Year Show – sân khấu sự kiện, ánh đèn hội tụ tài năng',
      description: 'NYS Club (New Year Show) là câu lạc bộ tổ chức sự kiện và sản xuất show diễn của FPT University Đà Nẵng. Chúng tôi chịu trách nhiệm sản xuất các chương trình giải trí lớn của trường như đêm gala, show cuối năm và các sự kiện chào đón tân sinh viên. NYS Club đào tạo kỹ năng tổ chức sự kiện, MC và production.',
      founded_year: 2018,
      member_count: 83,
      leader_id: userIds['ha.ttt@fpt.edu.vn'],
      contact_email: 'nys@fpt.edu.vn',
      contact_fb: 'https://fb.com/nysclub.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 1,
    },
    {
      name: 'TIA',
      slug: 'tia',
      category: 'community',
      short_desc: 'Together In Action – hành động vì cộng đồng, sống có ý nghĩa',
      description: 'TIA (Together In Action) là câu lạc bộ tình nguyện và phát triển cộng đồng tại FPT University Đà Nẵng. Chúng tôi tổ chức các hoạt động tình nguyện như dạy học miễn phí, hiến máu nhân đạo, bảo vệ môi trường biển và hỗ trợ trẻ em khó khăn. TIA tin rằng mỗi hành động nhỏ đều có thể tạo ra sự thay đổi lớn.',
      founded_year: 2017,
      member_count: 158,
      leader_id: null,
      contact_email: 'tia@fpt.edu.vn',
      contact_fb: 'https://fb.com/tia.fptdn',
      leader_fb: null,
      activities: null,
      departments: null,
      is_featured: 1,
    },
  ];

  const clubIds = {};
  clubs.forEach((c) => {
    const result = insertClub.run(c);
    clubIds[c.slug] = result.lastInsertRowid;
  });

  // Club members
  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)
  `);
  insertMember.run(clubIds['f2k'], userIds['khoi.nm@fpt.edu.vn'], 'leader');
  insertMember.run(clubIds['evo'], userIds['anh.ph@fpt.edu.vn'], 'member');
  insertMember.run(clubIds['fic'], userIds['ha.ttt@fpt.edu.vn'], 'leader');
  insertMember.run(clubIds['nys-club'], userIds['ha.ttt@fpt.edu.vn'], 'leader');
  insertMember.run(clubIds['src'], userIds['duc.lv@fpt.edu.vn'], 'leader');
  insertMember.run(clubIds['src'], userIds['anh.ht@fpt.edu.vn'], 'member');
  insertMember.run(clubIds['tia'], userIds['lan.vt@fpt.edu.vn'], 'member');

  // Events
  const insertEvent = db.prepare(`
    INSERT INTO events (club_id, title, description, start_time, end_time, location, status)
    VALUES (@club_id, @title, @description, @start_time, @end_time, @location, @status)
  `);

  const events = [
    {
      club_id: clubIds['evo'],
      title: 'EVO Tournament: Valorant Championship S1',
      description: 'Giải đấu Valorant nội bộ FPT Đà Nẵng với 16 đội tham gia. Tổng giải thưởng 5 triệu đồng cùng nhiều phần quà hấp dẫn từ các nhà tài trợ gaming.',
      start_time: '2026-03-20 09:00:00',
      end_time: '2026-03-20 18:00:00',
      location: 'Phòng Lab máy tính A2.01, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['f2k'],
      title: 'F2K Battle Royale – Street Dance Competition',
      description: 'Cuộc thi battle street dance mở với các thể loại B-boy, Popping, Locking. Mở cửa cho tất cả sinh viên FPT và các trường đại học khác tại Đà Nẵng.',
      start_time: '2026-03-22 14:00:00',
      end_time: '2026-03-22 20:00:00',
      location: 'Sân khấu ngoài trời, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['fum'],
      title: 'FUM Spring Concert 2026 – "Giai Điệu Mùa Xuân"',
      description: 'Đêm nhạc hội mùa xuân với hơn 20 tiết mục từ acoustic, pop đến band. Sự kiện âm nhạc lớn nhất học kỳ do FUM tổ chức.',
      start_time: '2026-04-10 19:00:00',
      end_time: '2026-04-10 21:30:00',
      location: 'Sân khấu ngoài trời, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['nys-club'],
      title: 'NYS Workshop: Kỹ năng MC & Dẫn chương trình',
      description: 'Workshop thực hành kỹ năng MC, dẫn chương trình sự kiện chuyên nghiệp. Giảng viên là các MC có kinh nghiệm tại Đà Nẵng.',
      start_time: '2026-03-18 14:00:00',
      end_time: '2026-03-18 17:00:00',
      location: 'Phòng hội thảo B1.02, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['tia'],
      title: 'TIA – Ngày hội Hiến máu nhân đạo Mùa Xuân',
      description: 'Chương trình hiến máu nhân đạo do TIA phối hợp với Bệnh viện Đà Nẵng tổ chức. Mỗi đơn vị máu là một sinh mệnh được cứu sống.',
      start_time: '2026-03-25 07:30:00',
      end_time: '2026-03-25 11:30:00',
      location: 'Hội trường FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['fvc-club'],
      title: 'FVC – Giải Bóng chuyền Sinh viên FPT Mở rộng',
      description: 'Giải bóng chuyền giao hữu giữa các khoa và các trường đại học tại Đà Nẵng. Hơn 16 đội tham gia ở cả nội dung nam và nữ.',
      start_time: '2026-04-05 07:00:00',
      end_time: '2026-04-06 17:00:00',
      location: 'Sân thể thao FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['rhythm'],
      title: 'Rhythm Showcase – K-pop & Contemporary Night',
      description: 'Đêm biểu diễn vũ đạo với các màn trình diễn K-pop cover và Contemporary dance. Rhythm mở cửa miễn phí cho toàn thể sinh viên FPT.',
      start_time: '2026-04-15 19:00:00',
      end_time: '2026-04-15 21:00:00',
      location: 'Sân khấu ngoài trời, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['fic'],
      title: 'FIC – Workshop: Quay phim bằng điện thoại',
      description: 'Học kỹ thuật quay phim chuyên nghiệp chỉ với chiếc điện thoại thông minh. Bao gồm cả kỹ năng dựng phim và chỉnh màu cơ bản.',
      start_time: '2026-03-28 09:00:00',
      end_time: '2026-03-28 12:00:00',
      location: 'Phòng Studio Media, Tầng 3 nhà A, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['fdn-nunchaku'],
      title: 'FDN Nunchaku – Biểu diễn võ thuật nghệ thuật',
      description: 'Chương trình biểu diễn nghệ thuật nunchaku kết hợp múa và võ thuật. FDN Nunchaku mang đến những màn trình diễn mãn nhãn và đầy sức mạnh.',
      start_time: '2026-03-30 15:00:00',
      end_time: '2026-03-30 17:00:00',
      location: 'Sân khấu FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['evo'],
      title: 'EVO LAN Party – Free Fire & PUBG Mobile',
      description: 'Buổi LAN Party thi đấu Free Fire và PUBG Mobile thân thiện, dành cho tất cả sinh viên FPT. Có quà tặng và snack miễn phí cho người tham gia.',
      start_time: '2026-02-20 13:00:00',
      end_time: '2026-02-20 18:00:00',
      location: 'Phòng Lab A2.02, FPT University Đà Nẵng',
      status: 'past',
    },
  ];

  events.forEach((e) => insertEvent.run(e));

  // Posts
  const insertPost = db.prepare(`
    INSERT INTO posts (club_id, author_id, title, content, type)
    VALUES (@club_id, @author_id, @title, @content, @type)
  `);

  const posts = [
    {
      club_id: clubIds['evo'],
      author_id: userIds['khoi.nm@fpt.edu.vn'],
      title: '🏆 EVO vô địch giải Valorant sinh viên Đà Nẵng 2023',
      content: 'Đội tuyển EVO đã xuất sắc giành chức vô địch giải Valorant sinh viên thành phố Đà Nẵng 2023, đánh bại 32 đội đến từ các trường đại học khác. Đây là kết quả của 3 tháng tập luyện miệt mài và sự đoàn kết của toàn đội. Chúc mừng các chiến binh EVO!',
      type: 'achievement',
    },
    {
      club_id: clubIds['fum'],
      author_id: userIds['admin@fpt.edu.vn'],
      title: '📢 FUM tuyển thành viên mới HK2/2024 – Đừng bỏ lỡ!',
      content: 'FUM đang tìm kiếm những tài năng âm nhạc mới để gia nhập gia đình. Chúng tôi chào đón ca sĩ, nhạc công, nhà soạn nhạc và cả những bạn chỉ đơn giản là yêu âm nhạc. Hạn đăng ký: 25/03/2024. Đăng ký ngay tại trang CLB hoặc liên hệ fanpage.',
      type: 'recruitment',
    },
    {
      club_id: clubIds['tia'],
      author_id: userIds['admin@fpt.edu.vn'],
      title: '❤️ TIA – Recap chuyến tình nguyện tại Huyện Hoà Vang',
      content: 'Chuyến tình nguyện hè 2023 tại Huyện Hoà Vang đã khép lại với những kết quả đáng tự hào. 120 tình nguyện viên TIA đã sơn sửa 6 phòng học, tặng 300 phần quà cho các em nhỏ và tổ chức ngày hội vui chơi với hơn 400 em tham gia. Cảm ơn tất cả những trái tim đã cùng nhau hành động!',
      type: 'recap',
    },
    {
      club_id: clubIds['nys-club'],
      author_id: userIds['ha.ttt@fpt.edu.vn'],
      title: '🎬 NYS Club hoàn thành xuất sắc Gala Cuối năm 2023',
      content: 'Đêm Gala Cuối năm 2023 do NYS Club sản xuất và tổ chức đã thu hút hơn 800 sinh viên tham dự. Với 4 tháng chuẩn bị công phu, NYS Club đã mang đến một đêm diễn hoành tráng với 15 tiết mục từ các CLB khác nhau trong trường.',
      type: 'recap',
    },
    {
      club_id: clubIds['f2k'],
      author_id: userIds['khoi.nm@fpt.edu.vn'],
      title: '💃 F2K tham gia Street Dance Championship Đà Nẵng 2023',
      content: 'Đội F2K đã xuất sắc lọt vào Top 3 tại Street Dance Championship Đà Nẵng 2023. Phần biểu diễn B-boy và Popping của đội nhận được nhiều tràng vỗ tay từ khán giả và ban giám khảo. Đây là động lực lớn để F2K tiếp tục chinh phục những đỉnh cao mới!',
      type: 'achievement',
    },
    {
      club_id: clubIds['fvc-club'],
      author_id: userIds['admin@fpt.edu.vn'],
      title: '🏐 FVC Club – Á quân giải Bóng chuyền Sinh viên TP. Đà Nẵng',
      content: 'Đội bóng chuyền nữ FVC Club đã giành được danh hiệu Á quân tại giải Bóng chuyền Sinh viên thành phố Đà Nẵng. Sau một hành trình thi đấu đầy cảm xúc, các bạn đã thể hiện được tinh thần đồng đội và kỹ thuật thi đấu xuất sắc. Chúc mừng toàn thể FVC Club!',
      type: 'achievement',
    },
  ];

  posts.forEach((p) => insertPost.run(p));

  // Applications
  const insertApp = db.prepare(`
    INSERT INTO applications (club_id, user_id, name, email, major, year, reason, status)
    VALUES (@club_id, @user_id, @name, @email, @major, @year, @reason, @status)
  `);

  const apps = [
    { club_id: clubIds['evo'], user_id: userIds['anh.ph@fpt.edu.vn'], name: 'Phạm Hồng Anh', email: 'anh.ph@fpt.edu.vn', major: 'CNTT', year: 2, reason: 'Tôi đam mê esports và muốn tham gia cộng đồng gaming tại FPT, đặc biệt là Valorant.', status: 'approved' },
    { club_id: clubIds['src'], user_id: userIds['anh.ht@fpt.edu.vn'], name: 'Hoàng Tuấn Anh', email: 'anh.ht@fpt.edu.vn', major: 'Ngôn ngữ Anh', year: 2, reason: 'Muốn đại diện cho sinh viên trong hội đồng và đóng góp ý kiến xây dựng trường.', status: 'approved' },
    { club_id: clubIds['tia'], user_id: userIds['lan.vt@fpt.edu.vn'], name: 'Võ Thị Lan', email: 'lan.vt@fpt.edu.vn', major: 'Kế toán', year: 1, reason: 'Tôi muốn đóng góp cho cộng đồng và trải nghiệm hoạt động tình nguyện ý nghĩa.', status: 'pending' },
    { club_id: clubIds['fic'], user_id: null, name: 'Nguyễn Thị Bảo Châu', email: 'chau.ntb@gmail.com', major: 'TTĐPT', year: 2, reason: 'Yêu thích nhiếp ảnh và làm phim, muốn học hỏi và phát triển cùng FIC.', status: 'pending' },
    { club_id: clubIds['fvc-club'], user_id: null, name: 'Trần Văn Hùng', email: 'hung.tv@gmail.com', major: 'QTKD', year: 3, reason: 'Đam mê bóng chuyền từ cấp 3, muốn tiếp tục thi đấu và kết bạn với đồng đội.', status: 'rejected' },
  ];

  apps.forEach((a) => insertApp.run(a));

  // Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, content, type, ref_id)
    VALUES (@user_id, @title, @content, @type, @ref_id)
  `);

  insertNotif.run({ user_id: userIds['anh.ph@fpt.edu.vn'], title: 'Đơn đăng ký đã được duyệt!', content: 'Chúc mừng! Đơn đăng ký tham gia CLB EVO của bạn đã được chấp nhận.', type: 'application', ref_id: clubIds['evo'] });
  insertNotif.run({ user_id: userIds['anh.ht@fpt.edu.vn'], title: 'Đơn đăng ký đã được duyệt!', content: 'Chúc mừng! Đơn đăng ký tham gia CLB SRC của bạn đã được chấp nhận.', type: 'application', ref_id: clubIds['src'] });
  insertNotif.run({ user_id: userIds['anh.ph@fpt.edu.vn'], title: 'Sự kiện sắp diễn ra!', content: 'EVO Tournament: Valorant Championship S1 sẽ diễn ra vào ngày 20/03/2026. Đừng quên đăng ký!', type: 'event', ref_id: 1 });

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin: admin@fpt.edu.vn / admin123');
  console.log('📧 Leader: khoi.nm@fpt.edu.vn / leader123');
  console.log('📧 Student: anh.ph@fpt.edu.vn / user123');
}

module.exports = db;
