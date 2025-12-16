'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SignaturePadProps {
    onSignatureChange: (signatureData: string | null) => void;
    width?: number;
    height?: number;
    penColor?: string;
    backgroundColor?: string;
    disabled?: boolean;
}

/**
 * SignaturePad Component
 * Canvas-based signature pad for digital agreement signing
 * Supports touch and mouse input
 */
export default function SignaturePad({
    onSignatureChange,
    width = 400,
    height = 200,
    penColor = '#1a1a2e',
    backgroundColor = '#f8fafc',
    disabled = false,
}: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Set background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Draw signature line
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, height - 30);
        ctx.lineTo(width - 20, height - 30);
        ctx.stroke();

        // Add "Sign here" text
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText('Sign here', width / 2 - 25, height - 10);
    }, [width, height, backgroundColor]);

    // Get coordinates from event
    const getCoordinates = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        }
    }, []);

    // Start drawing
    const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (disabled) return;
        // Note: Don't call preventDefault here - touch-action: none handles scroll prevention
        // Calling it on passive listeners causes warnings

        const coords = getCoordinates(e);
        if (!coords) return;

        setIsDrawing(true);
        setLastPoint(coords);
    }, [disabled, getCoordinates]);

    // Draw
    const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (!isDrawing || disabled) return;
        // Note: Don't call preventDefault here - touch-action: none handles scroll prevention

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !lastPoint) return;

        const coords = getCoordinates(e);
        if (!coords) return;

        ctx.strokeStyle = penColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();

        setLastPoint(coords);
        setHasSignature(true);
    }, [isDrawing, disabled, lastPoint, getCoordinates, penColor]);

    // Stop drawing
    const stopDrawing = useCallback(() => {
        if (isDrawing && hasSignature) {
            const canvas = canvasRef.current;
            if (canvas) {
                const signatureData = canvas.toDataURL('image/png');
                onSignatureChange(signatureData);
            }
        }
        setIsDrawing(false);
        setLastPoint(null);
    }, [isDrawing, hasSignature, onSignatureChange]);

    // Clear signature
    const clearSignature = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Clear and redraw background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Redraw signature line
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, height - 30);
        ctx.lineTo(width - 20, height - 30);
        ctx.stroke();

        // Redraw "Sign here" text
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText('Sign here', width / 2 - 25, height - 10);

        setHasSignature(false);
        onSignatureChange(null);
    }, [width, height, backgroundColor, onSignatureChange]);

    return (
        <div className="signature-pad-container">
            <div className="signature-pad-wrapper">
                <canvas
                    ref={canvasRef}
                    className={`signature-canvas ${disabled ? 'disabled' : ''}`}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{
                        touchAction: 'none',
                        cursor: disabled ? 'not-allowed' : 'crosshair',
                    }}
                />
            </div>

            <div className="signature-pad-actions">
                <button
                    type="button"
                    onClick={clearSignature}
                    disabled={disabled || !hasSignature}
                    className="btn-clear-signature"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    Clear Signature
                </button>

                {hasSignature && (
                    <span className="signature-status">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Signature captured
                    </span>
                )}
            </div>

            <style jsx>{`
        .signature-pad-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .signature-pad-wrapper {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background: ${backgroundColor};
        }

        .signature-canvas {
          display: block;
          width: 100%;
          max-width: ${width}px;
          height: auto;
          aspect-ratio: ${width} / ${height};
        }

        .signature-canvas.disabled {
          opacity: 0.6;
        }

        .signature-pad-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-clear-signature {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-clear-signature:hover:not(:disabled) {
          border-color: #f43f5e;
          color: #f43f5e;
          background: #fef2f2;
        }

        .btn-clear-signature:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .signature-status {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #10b981;
          font-size: 14px;
        }
      `}</style>
        </div>
    );
}
