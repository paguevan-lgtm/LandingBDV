import React, { useState, useEffect } from 'react';
import { Button } from './Shared';
import * as Icons from 'lucide-react';

const PixForm = ({ pixData, userId, systemContext, email }: any) => {
    const [loading, setLoading] = useState(false);
    const [pixDetails, setPixDetails] = useState<any>(pixData || null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopyPix = () => {
        if (!pixDetails?.qrCode) return;
        navigator.clipboard.writeText(pixDetails.qrCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePixPayment = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/create-pix-payment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('api_session_token')}`
                },
                body: JSON.stringify({ userId, systemContext, email })
            });
            
            if (!response.ok) {
                const text = await response.text();
                console.error('Server error response:', text);
                throw new Error('O servidor retornou um erro. Tente novamente mais tarde.');
            }

            const data = await response.json();
            
            if (data.url) {
                window.location.href = data.url;
            } else if (data.qrCodeBase64) {
                setPixDetails(data);
            } else {
                throw new Error('Falha ao gerar pagamento');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao processar PIX. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // If pixData was passed from parent, use it immediately
    useEffect(() => {
        if (pixData) setPixDetails(pixData);
    }, [pixData]);

    return (
        <div className="space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm text-center">{error}</div>}
            
            {!pixDetails ? (
                <div className="text-center py-4">
                    <p className="text-slate-400 text-sm mb-4">Clique abaixo para gerar o QR Code de pagamento avulso.</p>
                    <Button onClick={handlePixPayment} disabled={loading} className="w-full py-3" icon={Icons.QrCode}>
                        {loading ? 'Gerando PIX...' : 'Gerar QR Code PIX'}
                    </Button>
                </div>
            ) : (
                <div className="text-center space-y-6 bg-slate-700/30 p-6 rounded-2xl border border-white/5 animate-in fade-in zoom-in duration-300">
                    <div className="space-y-2">
                        <p className="text-white font-bold">Escaneie o QR Code abaixo:</p>
                        <p className="text-xs text-slate-400">O sistema é liberado instantaneamente após o pagamento.</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl inline-block shadow-xl">
                        <img src={pixDetails.qrCodeBase64} alt="PIX QR Code" className="w-48 h-48 mx-auto" referrerPolicy="no-referrer" />
                    </div>

                    <div className="space-y-3 px-2">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest leading-loose">Ou use o Copia e Cola:</p>
                        <div className="relative group">
                            <textarea 
                                readOnly 
                                value={pixDetails.qrCode} 
                                className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-blue-300 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <button 
                                onClick={handleCopyPix}
                                className={`absolute bottom-2 right-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                                    copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                            >
                                {copied ? <Icons.Check size={12} /> : <Icons.Copy size={12} />}
                                {copied ? 'Copiado!' : 'Copiar Código'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-slate-500 text-[10px]">
                        <Icons.Clock size={12} />
                        <span>Este QR Code expira em breve.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export const PixPayment = (props: any) => (
    <PixForm {...props} />
);
