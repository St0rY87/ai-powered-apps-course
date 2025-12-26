export const getCurrentDateTime = () => {
    const now = new Date();  
    
    const dateStr = now.toLocaleDateString('ru-RU', {
        timeZone: 'Europe/Minsk',
        weekday: 'long',    
        year: 'numeric',   
        month: 'long',      
        day: 'numeric'      
    });
    
    const timeStr = now.toLocaleTimeString('ru-RU', {
        timeZone: 'Europe/Minsk',
        hour: '2-digit',    
        minute: '2-digit', 
        // second: '2-digit'   
    });
    return `Сегодняшняя дата: ${dateStr}`;
}

