<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\MessagingException;
use Kreait\Firebase\Messaging\AndroidConfig;
use Kreait\Firebase\Messaging\ApnsConfig;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\Messaging\WebpushConfig;

class FirebaseService
{
    public function __construct(protected Messaging $messaging) {}

    public function sendToDevice(string $token, string $title, string $body, array $data = [], array $options = []): array
    {
        return $this->sendMessage([$token], $title, $body, $data, $options);
    }

    public function sendToMultipleDevices(array $tokens, string $title, string $body, array $data = [], array $options = []): array
    {
        if (empty($tokens)) {
            throw new \InvalidArgumentException('Device tokens array cannot be empty');
        }

        return $this->sendMessage($tokens, $title, $body, $data, $options, true);
    }

    private function sendMessage(array $tokens, string $title, string $body, array $data, array $options, bool $multicast = false): array
    {
        try {
            $notification = Notification::create($title, $body);

            $message = CloudMessage::new()
                ->withNotification($notification)
                ->toToken(...$tokens)
                ->withData($data);

            $message = $this->applyPlatformConfigs($message, $options);

            if ($multicast) {
                $response = $this->messaging->sendMulticast($message, $tokens);

                return $this->formatMulticastResponse($response, $tokens);
            }

            return ['message_id' => $this->messaging->send($message)];
        } catch (MessagingException | Exception $e) {
            Log::error('Firebase Messaging Error', [
                'exception' => $e,
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ['error' => $e->getMessage(), 'code' => $e->getCode()];
        }
    }

    private function formatMulticastResponse($response, array $tokens): array
    {

        return [
            'total_sent' => $response->successes()->count(),
            'total_failed' => $response->failures()->count(),
            'success_count' => $response->successes()->count(),
            'failure_count' => $response->failures()->count()
        ];

        // TODOD: fix this, error

        // $results = [];
        // foreach ($response->failures()->getItems() as $item) {
        //     $results[] = ['token' => $tokens[$item->index()], 'success' => false, 'error' => $item->error()->getMessage()];
        // }
        // foreach ($response->successes()->getItems() as $item) {
        //     $results[] = ['token' => $tokens[$item->index()], 'success' => true, 'message_id' => $item->result()];
        // }

        // return ['total_sent' => $response->successes()->count(), 'total_failed' => $response->failures()->count(), 'results' => $results];
    }

    private function applyPlatformConfigs(CloudMessage $message, array $options = []): CloudMessage
    {
        if (isset($options['android'])) {
            $message = $message->withAndroidConfig(AndroidConfig::fromArray($options['android']));
        } else {
            $message = $message->withAndroidConfig(AndroidConfig::new()->withHighMessagePriority());
        }

        if (isset($options['apns'])) {
            $message = $message->withApnsConfig(ApnsConfig::fromArray($options['apns']));
        } else {
            $message = $message->withApnsConfig(ApnsConfig::new()->withSound('default'));
        }

        if (isset($options['webpush'])) {
            $message = $message->withWebPushConfig(WebpushConfig::fromArray($options['webpush']));
        }

        return $message;
    }
}
