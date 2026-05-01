async function getCSV() {
    const url = 'https://przkbwghllwzmlrxjamw.supabase.co/rest/v1/questions?select=*';
    const key = 'sb_publishable_I0w4S48S2JNKOzntSpV9LA_Kkz7DRwD';
    
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Accept': 'text/csv'
            }
        });
        const text = await response.text();
        console.log('CSV Headers/Data:', text);
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

getCSV();
