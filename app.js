// グローバル変数
let currentUser = null;
let currentQuestId = null;
let currentMindId = null;
let quests = [];
let minds = [];
let dailyChecks = {};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAndResetDailyData();
});

// アプリ初期化
function initializeApp() {
    // Firebase認証の監視
    window.firebase.onAuthStateChanged(window.firebase.auth, (user) => {
        if (user) {
            currentUser = user;
            showApp();
            loadUserData();
        } else {
            currentUser = null;
            showLoginScreen();
        }
        hideLoading();
    });
}

// イベントリスナーの設定
function setupEventListeners() {
    // Googleログイン
    document.getElementById('googleLoginBtn').addEventListener('click', handleGoogleLogin);
    
    // ログアウト
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // FABボタン
    document.getElementById('addBtn').addEventListener('click', handleAddButtonClick);
    
    // フォームサブミット
    document.getElementById('questForm').addEventListener('submit', handleQuestSubmit);
    document.getElementById('mindForm').addEventListener('submit', handleMindSubmit);
    
    // モーダル外側クリックで閉じる
    document.getElementById('questModal').addEventListener('click', (e) => {
        if (e.target.id === 'questModal') closeQuestModal();
    });
    document.getElementById('mindModal').addEventListener('click', (e) => {
        if (e.target.id === 'mindModal') closeMindModal();
    });
}

// Google認証
async function handleGoogleLogin() {
    const provider = new window.firebase.GoogleAuthProvider();
    try {
        await window.firebase.signInWithPopup(window.firebase.auth, provider);
    } catch (error) {
        console.error('ログインエラー:', error);
        alert('ログインに失敗しました。もう一度お試しください。');
    }
}

// ログアウト
async function handleLogout() {
    if (confirm('ログアウトしますか？')) {
        try {
            await window.firebase.signOut(window.firebase.auth);
        } catch (error) {
            console.error('ログアウトエラー:', error);
        }
    }
}

// 画面表示制御
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    
    // ユーザー情報表示
    document.getElementById('userName').textContent = currentUser.displayName || 'ユーザー';
    document.getElementById('userAvatar').src = currentUser.photoURL || '';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// タブ切り替え
function switchTab(tabName) {
    // タブボタンの active を切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // タブコンテンツの表示切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// FABボタンクリック処理
function handleAddButtonClick() {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    
    if (activeTab === 'minds') {
        openMindModal();
    } else {
        openQuestModal();
    }
}

// データ読み込み
async function loadUserData() {
    await Promise.all([
        loadQuests(),
        loadMinds(),
        loadDailyChecks()
    ]);
    
    renderAll();
}

// クエスト読み込み
async function loadQuests() {
    try {
        const q = window.firebase.query(
            window.firebase.collection(window.firebase.db, 'quests'),
            window.firebase.where('userId', '==', currentUser.uid),
            window.firebase.orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await window.firebase.getDocs(q);
        quests = [];
        
        querySnapshot.forEach((doc) => {
            quests.push({
                id: doc.id,
                ...doc.data()
            });
        });
    } catch (error) {
        console.error('クエスト読み込みエラー:', error);
    }
}

// マインド読み込み
async function loadMinds() {
    try {
        const q = window.firebase.query(
            window.firebase.collection(window.firebase.db, 'minds'),
            window.firebase.where('userId', '==', currentUser.uid),
            window.firebase.orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await window.firebase.getDocs(q);
        minds = [];
        
        querySnapshot.forEach((doc) => {
            minds.push({
                id: doc.id,
                ...doc.data()
            });
        });
    } catch (error) {
        console.error('マインド読み込みエラー:', error);
    }
}

// 日次チェックデータ読み込み
async function loadDailyChecks() {
    const today = new Date().toISOString().split('T')[0];
    const docRef = window.firebase.doc(window.firebase.db, 'dailyChecks', `${currentUser.uid}_${today}`);
    
    try {
        const docSnap = await window.firebase.getDoc(docRef);
        if (docSnap.exists()) {
            dailyChecks = docSnap.data().checks || {};
        } else {
            dailyChecks = {};
        }
    } catch (error) {
        console.error('日次データ読み込みエラー:', error);
        dailyChecks = {};
    }
}

// 日次データ保存
async function saveDailyChecks() {
    const today = new Date().toISOString().split('T')[0];
    const docRef = window.firebase.doc(window.firebase.db, 'dailyChecks', `${currentUser.uid}_${today}`);
    
    try {
        await window.firebase.setDoc(docRef, {
            userId: currentUser.uid,
            date: today,
            checks: dailyChecks,
            updatedAt: window.firebase.serverTimestamp()
        });
    } catch (error) {
        console.error('日次データ保存エラー:', error);
    }
}

// 全体描画
function renderAll() {
    renderQuests();
    renderDailyTasks();
    renderKPIs();
    renderMinds();
}

// クエスト描画
function renderQuests() {
    const categories = {
        temptation: document.getElementById('temptationQuests'),
        organization: document.getElementById('organizationQuests'),
        military: document.getElementById('militaryQuests'),
        finance: document.getElementById('financeQuests')
    };
    
    const completedContainer = document.getElementById('completedQuests');
    
    // クリア
    Object.values(categories).forEach(container => container.innerHTML = '');
    completedContainer.innerHTML = '';
    
    // クエスト配置
    quests.forEach(quest => {
        const isCompleted = calculateQuestCompletion(quest) === 100;
        const questCard = createQuestCard(quest);
        
        if (isCompleted) {
            completedContainer.appendChild(questCard);
        } else if (categories[quest.category]) {
            categories[quest.category].appendChild(questCard);
        }
    });
    
    // ドラッグ&ドロップ設定
    setupDragAndDrop();
}

// クエストカード作成
function createQuestCard(quest) {
    const completion = calculateQuestCompletion(quest);
    const card = document.createElement('div');
    card.className = 'quest-card';
    card.draggable = true;
    card.dataset.questId = quest.id;
    card.dataset.category = quest.category;
    
    card.innerHTML = `
        <div class="quest-card-header">
            <h3 class="quest-card-title">${quest.title}</h3>
            <div class="quest-card-actions">
                <button class="quest-edit-btn" onclick="editQuest('${quest.id}')">
                    <span class="material-icons">edit</span>
                </button>
                <button class="quest-delete-btn" onclick="deleteQuest('${quest.id}')">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        </div>
        <div class="quest-completion">
            <div class="completion-text">KPI達成率: ${completion}%</div>
            <div class="completion-bar">
                <div class="completion-fill" style="width: ${completion}%"></div>
            </div>
        </div>
        ${quest.notes ? `<div class="quest-notes">${quest.notes}</div>` : ''}
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.quest-edit-btn') && !e.target.closest('.quest-delete-btn')) {
            showQuestDetails(quest.id);
        }
    });
    
    return card;
}

// KPI達成率計算
function calculateQuestCompletion(quest) {
    if (!quest.kpis || quest.kpis.length === 0) return 0;
    
    let totalCompletion = 0;
    quest.kpis.forEach(kpi => {
        const current = kpi.current || 0;
        const target = kpi.target || 1;
        const percentage = Math.min((current / target) * 100, 100);
        totalCompletion += percentage;
    });
    
    return Math.round(totalCompletion / quest.kpis.length);
}

// 毎日やること描画
function renderDailyTasks() {
    const container = document.getElementById('dailyTasksList');
    container.innerHTML = '';
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    quests.forEach(quest => {
        if (quest.dailyTasks && quest.dailyTasks.length > 0) {
            quest.dailyTasks.forEach(task => {
                totalTasks++;
                const taskId = `${quest.id}_${task}`;
                const isChecked = dailyChecks[taskId] || false;
                
                if (isChecked) completedTasks++;
                
                const taskItem = document.createElement('div');
                taskItem.className = `daily-task-item ${isChecked ? 'completed' : ''}`;
                
                taskItem.innerHTML = `
                    <label class="task-checkbox">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} 
                               onchange="toggleDailyTask('${taskId}', this.checked)">
                        <span class="checkbox-custom"></span>
                        <div class="task-content">
                            <div class="task-title">${task}</div>
                            <div class="task-quest">クエスト: ${quest.title}</div>
                        </div>
                    </label>
                `;
                
                container.appendChild(taskItem);
            });
        }
    });
    
    // 進捗バー更新
    updateDailyProgress(completedTasks, totalTasks);
}

// 日次進捗更新
function updateDailyProgress(completed, total) {
    const progressText = document.getElementById('dailyProgress');
    const progressBar = document.getElementById('dailyProgressBar');
    
    progressText.textContent = `${completed}/${total} タスク完了`;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
}

// 日次タスクトグル
async function toggleDailyTask(taskId, checked) {
    dailyChecks[taskId] = checked;
    await saveDailyChecks();
    renderDailyTasks();
}

// KPI一覧描画
function renderKPIs() {
    const container = document.getElementById('kpisList');
    container.innerHTML = '';
    
    quests.forEach(quest => {
        if (quest.kpis && quest.kpis.length > 0) {
            quest.kpis.forEach((kpi, index) => {
                const kpiItem = document.createElement('div');
                kpiItem.className = 'kpi-item';
                
                const current = kpi.current || 0;
                const target = kpi.target || 1;
                const percentage = Math.min((current / target) * 100, 100);
                const isCompleted = current >= target;
                
                kpiItem.innerHTML = `
                    <div class="kpi-header">
                        <div class="kpi-info">
                            <div class="kpi-title">${kpi.title}</div>
                            <div class="kpi-quest">クエスト: ${quest.title}</div>
                        </div>
                        ${isCompleted ? '<span class="kpi-completed">✓ 達成</span>' : ''}
                    </div>
                    <div class="kpi-controls">
                        <button class="kpi-btn" onclick="updateKPI('${quest.id}', ${index}, -1)">
                            <span class="material-icons">remove</span>
                        </button>
                        <div class="kpi-value">
                            <span class="kpi-current">${current}</span>
                            <span class="kpi-separator">/</span>
                            <span class="kpi-target">${target}</span>
                            <span class="kpi-unit">${kpi.unit || ''}</span>
                        </div>
                        <button class="kpi-btn" onclick="updateKPI('${quest.id}', ${index}, 1)">
                            <span class="material-icons">add</span>
                        </button>
                    </div>
                    <div class="kpi-progress">
                        <div class="kpi-progress-bar">
                            <div class="kpi-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="kpi-percentage">${Math.round(percentage)}%</span>
                    </div>
                `;
                
                container.appendChild(kpiItem);
            });
        }
    });
}

// KPI更新
async function updateKPI(questId, kpiIndex, delta) {
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.kpis || !quest.kpis[kpiIndex]) return;
    
    const current = quest.kpis[kpiIndex].current || 0;
    quest.kpis[kpiIndex].current = Math.max(0, current + delta);
    
    try {
        const docRef = window.firebase.doc(window.firebase.db, 'quests', questId);
        await window.firebase.updateDoc(docRef, {
            kpis: quest.kpis,
            updatedAt: window.firebase.serverTimestamp()
        });
        
        renderAll();
    } catch (error) {
        console.error('KPI更新エラー:', error);
    }
}

// マインド描画
function renderMinds() {
    const mindsList = document.getElementById('mindsList');
    const checkedList = document.getElementById('checkedMindsList');
    
    mindsList.innerHTML = '';
    checkedList.innerHTML = '';
    
    minds.forEach(mind => {
        const isChecked = dailyChecks[`mind_${mind.id}`] || false;
        const mindItem = document.createElement('div');
        mindItem.className = 'mind-item';
        
        mindItem.innerHTML = `
            <label class="mind-checkbox">
                <input type="checkbox" ${isChecked ? 'checked' : ''} 
                       onchange="toggleMind('${mind.id}', this.checked)">
                <span class="checkbox-custom"></span>
                <div class="mind-content">
                    <div class="mind-text">${mind.text}</div>
                </div>
            </label>
            <div class="mind-actions">
                <button class="mind-edit-btn" onclick="editMind('${mind.id}')">
                    <span class="material-icons">edit</span>
                </button>
                <button class="mind-delete-btn" onclick="deleteMind('${mind.id}')">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        `;
        
        if (isChecked) {
            checkedList.appendChild(mindItem);
        } else {
            mindsList.appendChild(mindItem);
        }
    });
}

// マインドトグル
async function toggleMind(mindId, checked) {
    dailyChecks[`mind_${mindId}`] = checked;
    await saveDailyChecks();
    renderMinds();
}

// クエストモーダル操作
function openQuestModal(quest = null) {
    currentQuestId = quest ? quest.id : null;
    const modal = document.getElementById('questModal');
    const title = document.getElementById('questModalTitle');
    const form = document.getElementById('questForm');
    const dailyTaskContainer = document.getElementById('dailyTaskInputs');
    const kpiContainer = document.getElementById('kpiInputs');

    title.textContent = quest ? 'クエストを編集' : 'クエストを追加';

    dailyTaskContainer.innerHTML = '';
    kpiContainer.innerHTML = '';

    if (quest) {
        document.getElementById('questTitle').value = quest.title || '';
        document.getElementById('questCategory').value = quest.category || 'temptation';
        document.getElementById('questNotes').value = quest.notes || '';

        const tasks = (quest.dailyTasks && quest.dailyTasks.length > 0)
            ? quest.dailyTasks
            : [''];
        tasks.forEach(task => addDailyTaskInput(task));

        if (quest.kpis && quest.kpis.length > 0) {
            quest.kpis.forEach(kpi => {
                addKpiInput(kpi);
            });
        } else {
            addKpiInput();
        }
    } else {
        form.reset();
        addDailyTaskInput();
        addKpiInput();
    }

    modal.classList.add('open');
}

function closeQuestModal() {
    document.getElementById('questModal').classList.remove('open');
    document.getElementById('questForm').reset();
    document.getElementById('kpiInputs').innerHTML = '';
    document.getElementById('dailyTaskInputs').innerHTML = '';
    currentQuestId = null;
}

// KPI入力欄操作
function addKpiInput(kpi = null) {
    const container = document.getElementById('kpiInputs');
    const div = document.createElement('div');
    div.className = 'kpi-input-group';
    
    div.innerHTML = `
        <input type="text" placeholder="KPI名" class="kpi-title" value="${kpi ? kpi.title : ''}">
        <input type="number" placeholder="目標値" class="kpi-target" value="${kpi ? kpi.target : ''}">
        <input type="text" placeholder="単位" class="kpi-unit" value="${kpi ? kpi.unit : ''}">
        <button type="button" class="remove-kpi-btn" onclick="removeKpiInput(this)">
            <span class="material-icons">remove_circle</span>
        </button>
    `;
    
    container.appendChild(div);
}

window.addKpiInput = addKpiInput;

function removeKpiInput(button) {
    const container = document.getElementById('kpiInputs');
    if (container.children.length > 1) {
        button.closest('.kpi-input-group').remove();
    }
}

window.removeKpiInput = removeKpiInput;

// 毎日やること入力欄操作
function addDailyTaskInput(task = '') {
    const container = document.getElementById('dailyTaskInputs');
    const div = document.createElement('div');
    div.className = 'daily-task-input-group';

    div.innerHTML = `
        <input type="text" class="daily-task-input" placeholder="タスクを入力" value="">
        <button type="button" class="remove-daily-task-btn" onclick="removeDailyTaskInput(this)">
            <span class="material-icons">remove_circle</span>
        </button>
    `;

    container.appendChild(div);

    const input = div.querySelector('.daily-task-input');
    input.value = task;

    if (!task) {
        input.focus();
    }

    updateDailyTaskRemoveButtons();
}

function removeDailyTaskInput(button) {
    const container = document.getElementById('dailyTaskInputs');
    if (container.children.length > 1) {
        button.closest('.daily-task-input-group').remove();
    }
    updateDailyTaskRemoveButtons();
}

function updateDailyTaskRemoveButtons() {
    const container = document.getElementById('dailyTaskInputs');
    const shouldHide = container.children.length <= 1;
    container.querySelectorAll('.remove-daily-task-btn').forEach(button => {
        button.style.visibility = shouldHide ? 'hidden' : 'visible';
    });
}

window.addDailyTaskInput = addDailyTaskInput;
window.removeDailyTaskInput = removeDailyTaskInput;

// クエスト保存
async function handleQuestSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('questTitle').value.trim();
    const category = document.getElementById('questCategory').value;
    const notes = document.getElementById('questNotes').value.trim();

    // KPIデータ収集
    const kpis = [];
    document.querySelectorAll('.kpi-input-group').forEach(group => {
        const kpiTitle = group.querySelector('.kpi-title').value.trim();
        const kpiTarget = parseInt(group.querySelector('.kpi-target').value) || 0;
        const kpiUnit = group.querySelector('.kpi-unit').value.trim();
        
        if (kpiTitle && kpiTarget > 0) {
            // 既存のKPIの現在値を保持
            let current = 0;
            if (currentQuestId) {
                const existingQuest = quests.find(q => q.id === currentQuestId);
                if (existingQuest && existingQuest.kpis) {
                    const existingKpi = existingQuest.kpis.find(k => k.title === kpiTitle);
                    if (existingKpi) {
                        current = existingKpi.current || 0;
                    }
                }
            }
            
            kpis.push({
                title: kpiTitle,
                target: kpiTarget,
                unit: kpiUnit,
                current: current
            });
        }
    });

    // 毎日やることを配列に
    const dailyTasks = Array.from(document.querySelectorAll('.daily-task-input'))
        .map(input => input.value.trim())
        .filter(task => task.length > 0);
    
    const questData = {
        title,
        category,
        kpis,
        dailyTasks,
        notes,
        userId: currentUser.uid,
        updatedAt: window.firebase.serverTimestamp()
    };
    
    try {
        if (currentQuestId) {
            // 更新
            const docRef = window.firebase.doc(window.firebase.db, 'quests', currentQuestId);
            await window.firebase.updateDoc(docRef, questData);
        } else {
            // 新規作成
            questData.createdAt = window.firebase.serverTimestamp();
            await window.firebase.setDoc(
                window.firebase.doc(window.firebase.collection(window.firebase.db, 'quests')),
                questData
            );
        }
        
        closeQuestModal();
        await loadQuests();
        renderAll();
    } catch (error) {
        console.error('クエスト保存エラー:', error);
        alert('保存に失敗しました。もう一度お試しください。');
    }
}

// クエスト編集
window.editQuest = function(questId) {
    const quest = quests.find(q => q.id === questId);
    if (quest) {
        openQuestModal(quest);
    }
};

// クエスト削除
window.deleteQuest = async function(questId) {
    if (!confirm('このクエストを削除しますか？')) return;
    
    try {
        await window.firebase.deleteDoc(window.firebase.doc(window.firebase.db, 'quests', questId));
        await loadQuests();
        renderAll();
    } catch (error) {
        console.error('クエスト削除エラー:', error);
    }
};

// クエスト詳細表示
function showQuestDetails(questId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    
    // ここで詳細モーダルを表示する（必要に応じて実装）
    console.log('クエスト詳細:', quest);
}

// マインドモーダル操作
function openMindModal(mind = null) {
    currentMindId = mind ? mind.id : null;
    const modal = document.getElementById('mindModal');
    const title = document.getElementById('mindModalTitle');
    
    title.textContent = mind ? 'マインドを編集' : 'マインドを追加';
    
    if (mind) {
        document.getElementById('mindText').value = mind.text || '';
    } else {
        document.getElementById('mindForm').reset();
    }
    
    modal.classList.add('open');
}

function closeMindModal() {
    document.getElementById('mindModal').classList.remove('open');
    document.getElementById('mindForm').reset();
    currentMindId = null;
}

window.closeMindModal = closeMindModal;
window.closeQuestModal = closeQuestModal;

// マインド保存
async function handleMindSubmit(e) {
    e.preventDefault();
    
    const text = document.getElementById('mindText').value.trim();
    if (!text) return;
    
    const mindData = {
        text,
        userId: currentUser.uid,
        updatedAt: window.firebase.serverTimestamp()
    };
    
    try {
        if (currentMindId) {
            // 更新
            const docRef = window.firebase.doc(window.firebase.db, 'minds', currentMindId);
            await window.firebase.updateDoc(docRef, mindData);
        } else {
            // 新規作成
            mindData.createdAt = window.firebase.serverTimestamp();
            await window.firebase.setDoc(
                window.firebase.doc(window.firebase.collection(window.firebase.db, 'minds')),
                mindData
            );
        }
        
        closeMindModal();
        await loadMinds();
        renderMinds();
    } catch (error) {
        console.error('マインド保存エラー:', error);
        alert('保存に失敗しました。もう一度お試しください。');
    }
}

// マインド編集
window.editMind = function(mindId) {
    const mind = minds.find(m => m.id === mindId);
    if (mind) {
        openMindModal(mind);
    }
};

// マインド削除
window.deleteMind = async function(mindId) {
    if (!confirm('このマインドを削除しますか？')) return;
    
    try {
        await window.firebase.deleteDoc(window.firebase.doc(window.firebase.db, 'minds', mindId));
        await loadMinds();
        renderMinds();
    } catch (error) {
        console.error('マインド削除エラー:', error);
    }
};

// ドラッグ&ドロップ設定
function setupDragAndDrop() {
    const cards = document.querySelectorAll('.quest-card');
    const containers = document.querySelectorAll('.quest-grid');
    
    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });
    
    containers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const container = e.currentTarget;
    const afterElement = getDragAfterElement(container, e.clientY);
    
    if (afterElement == null) {
        container.appendChild(draggedElement);
    } else {
        container.insertBefore(draggedElement, afterElement);
    }
}

async function handleDrop(e) {
    e.preventDefault();
    
    const questId = draggedElement.dataset.questId;
    const newCategory = e.currentTarget.closest('.category-section')?.dataset.category;
    
    if (newCategory && newCategory !== draggedElement.dataset.category) {
        // カテゴリ変更を保存
        try {
            const docRef = window.firebase.doc(window.firebase.db, 'quests', questId);
            await window.firebase.updateDoc(docRef, {
                category: newCategory,
                updatedAt: window.firebase.serverTimestamp()
            });
            
            draggedElement.dataset.category = newCategory;
            
            // データを再読み込み
            await loadQuests();
        } catch (error) {
            console.error('カテゴリ更新エラー:', error);
        }
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.quest-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// KPI更新をグローバルスコープで利用可能に
window.updateKPI = updateKPI;
window.toggleDailyTask = toggleDailyTask;
window.toggleMind = toggleMind;

// 日次データリセット確認
function checkAndResetDailyData() {
    const lastResetDate = localStorage.getItem('lastResetDate');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastResetDate !== today) {
        // マインドのチェック状態をリセット
        dailyChecks = {};
        localStorage.setItem('lastResetDate', today);
        
        // 必要に応じて他のリセット処理を追加
    }
    
    // 毎日0時にリセット
    scheduleNextReset();
}

function scheduleNextReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
        checkAndResetDailyData();
        if (currentUser) {
            renderAll();
        }
    }, msUntilMidnight);
}