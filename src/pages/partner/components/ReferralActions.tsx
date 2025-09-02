import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Copy, Plus, Link } from 'lucide-react';
import { PartnerCode } from '../types/dashboard';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../hooks/use-toast';

interface ReferralActionsProps {
  codes: PartnerCode[];
  partnerId: string;
  onCodeCreated: () => void;
}

export function ReferralActions({ codes, partnerId, onCodeCreated }: ReferralActionsProps) {
  const { t } = useTranslation('partners');
  const { toast } = useToast();
  const [newCode, setNewCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('actions.copied'),
        description: t('actions.linkCopied'),
      });
    } catch (err) {
      toast({
        title: t('actions.error'),
        description: t('actions.copyFailed'),
        variant: 'destructive',
      });
    }
  };

  const createNewCode = async () => {
    if (!newCode.trim()) {
      toast({
        title: t('actions.error'),
        description: t('actions.codeRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (codes.length >= 3) {
      toast({
        title: t('actions.error'),
        description: t('actions.maxCodesReached'),
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      // TODO: Implement code creation logic
      // await createPartnerCode(partnerId, newCode.trim());
      toast({
        title: t('actions.success'),
        description: t('actions.codeCreated'),
      });
      setNewCode('');
      onCodeCreated();
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('actions.codeCreationFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getReferralLink = (code: string) => {
    return `${window.location.origin}/?ref=${code}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          {t('dashboard.referralActions')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new code */}
        <div className="flex gap-2">
          <Input
            placeholder={t('actions.enterCodeName')}
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            disabled={isCreating || codes.length >= 3}
          />
          <Button
            onClick={createNewCode}
            disabled={isCreating || codes.length >= 3 || !newCode.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('actions.create')}
          </Button>
        </div>

        {/* Code limit info */}
        <div className="text-sm text-muted-foreground">
          {t('actions.codesUsed', { used: codes.length, max: 3 })}
        </div>

        {/* Existing codes */}
        <div className="space-y-3">
          {codes.map((code) => (
            <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">{code.code}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {t('actions.usageCount', { count: code.usageCount })}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getReferralLink(code.code)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(getReferralLink(code.code))}
              >
                <Copy className="h-4 w-4 mr-1" />
                {t('actions.copy')}
              </Button>
            </div>
          ))}
        </div>

        {codes.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Link className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('dashboard.noCodesYet')}</p>
            <p className="text-sm">{t('dashboard.createFirstCode')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
