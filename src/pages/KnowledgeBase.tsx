import { KnowledgeEntryManager } from '@/components/KnowledgeEntryManager';
import { useAuth } from '@/hooks/useAuth';

const KnowledgeBase = () => {
    const { profile } = useAuth();

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <KnowledgeEntryManager instructorId={profile.id} />;
};

export default KnowledgeBase;
