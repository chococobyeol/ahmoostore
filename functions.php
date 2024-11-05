<?php

add_action('init', function() {
    if (PHP_SESSION_NONE === session_status()) {
        session_start();
    }

    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $allowed_origins = array(
            'https://ahmoostore.onrender.com',
            'http://localhost:3000'
        );

        if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
            header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
            header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
            header("Access-Control-Allow-Credentials: true");
            header("Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce");
            header("Access-Control-Expose-Headers: *");
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(200);
        exit();
    }
}, 1);

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'register_user_api',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/login', array(
        'methods' => 'POST',
        'callback' => 'login_user_api',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/update-order-status', array(
        'methods' => ['POST', 'OPTIONS'],
        'callback' => 'update_order_status_callback',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/my-orders', array(
        'methods' => 'GET',
        'callback' => 'get_user_orders_api',
        'permission_callback' => function() {
            return is_user_logged_in();
        }
    ));
});

function register_user_api($request) {
    $username = sanitize_user($request['username']);
    $email = sanitize_email($request['email']);
    $password = $request['password'];

    $error = new WP_Error();

    if (empty($username)) {
        $error->add('username_empty', '사용자 이름은 필수입니다.');
    }
    if (empty($email)) {
        $error->add('email_empty', '이메일은 필수입니다.');
    }
    if (empty($password)) {
        $error->add('password_empty', '비밀번호는 필수입니다.');
    }

    if ($error->get_error_codes()) {
        return $error;
    }

    $user_id = wp_create_user($username, $password, $email);

    if (is_wp_error($user_id)) {
        return $user_id;
    }

    $user = new WP_User($user_id);
    $user->set_role('customer');

    return array(
        'status' => 'success',
        'message' => '회원가입이 완료되었습니다.'
    );
}

function login_user_api($request) {
    $username = $request['username'];
    $password = $request['password'];

    $user = wp_authenticate($username, $password);

    if (is_wp_error($user)) {
        return new WP_Error(
            'login_failed',
            '로그인에 실패했습니다.',
            array('status' => 401)
        );
    }

    wp_set_current_user($user->ID);
    wp_set_auth_cookie($user->ID, true);

    return array(
        'status' => 'success',
        'message' => '로그인 성공',
        'user' => array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'displayName' => $user->display_name
        )
    );
}

function update_order_status_callback($request) {
    $json = $request->get_json_params();
    $order_id = isset($json['order_id']) ? sanitize_text_field($json['order_id']) : '';
    
    error_log('[토스페이먼츠] 주문 상태 업데이트 시작 - Order ID: ' . $order_id);
    
    if (empty($order_id)) {
        return new WP_Error('no_order_id', '주문 ID가 필요합니다.', array('status' => 400));
    }

    try {
        // 주문 ID 정리
        $order_id = str_replace('#', '', $order_id);
        
        // WooCommerce 주문 객체 가져오기
        $order = wc_get_order($order_id);
        if (!$order) {
            throw new Exception('주문을 찾을 수 없습니다.');
        }

        // 결제 완료 처리
        $order->payment_complete();
        
        // 주문 상태 변경
        $order->update_status('processing');
        
        // 주문 메모 추가
        $order->add_order_note('토스페이먼츠 결제가 완료되었습니다.');
        
        // 변경사항 저장
        $order->save();
        
        error_log('[토스페이먼츠] 주문 처리 완료 - Order ID: ' . $order_id);
        
        return array(
            'success' => true,
            'message' => '주문 상태가 업데이트되었습니다.',
            'order_id' => $order_id
        );
        
    } catch (Exception $e) {
        error_log('[토스페이먼츠] 오류 발생: ' . $e->getMessage());
        return new WP_Error(
            'update_failed',
            '주문 상태 업데이트 실패: ' . $e->getMessage(),
            array('status' => 500)
        );
    }
}

function get_user_orders_api($request) {
    if (!is_user_logged_in()) {
        return new WP_Error(
            'rest_not_logged_in',
            '로그인이 필요합니다.',
            array('status' => 401)
        );
    }

    $user_id = get_current_user_id();
    $orders = wc_get_orders(array(
        'customer_id' => $user_id,
        'limit' => -1
    ));

    $formatted_orders = array_map(function($order) {
        return array(
            'id' => $order->get_id(),
            'status' => $order->get_status(),
            'status_name' => wc_get_order_status_name($order->get_status()),
            'total' => $order->get_total(),
            'date_created' => $order->get_date_created()->format('Y-m-d H:i:s'),
            'payment_method' => $order->get_payment_method_title(),
            'items' => array_map(function($item) {
                $product = $item->get_product();
                return array(
                    'name' => $item->get_name(),
                    'quantity' => $item->get_quantity(),
                    'total' => $item->get_total(),
                    'image' => $product ? wp_get_attachment_url($product->get_image_id()) : null
                );
            }, $order->get_items())
        );
    }, $orders);

    return array(
        'success' => true,
        'orders' => $formatted_orders
    );
}

add_filter('woocommerce_rest_check_permissions', function($permission, $context, $object_id, $post_type) {
    if ($post_type === 'shop_order') {
        error_log('WooCommerce 주문 권한 체크: ' . $context);
        
        if (!is_user_logged_in()) {
            return false;
        }
        
        if ($object_id) {
            $order = wc_get_order($object_id);
            if ($order) {
                return $order->get_customer_id() === get_current_user_id();
            }
        }
    }
    return $permission;
}, 10, 4);

add_filter('woocommerce_rest_pre_insert_shop_order_object', function($order, $request) {
    error_log('WooCommerce 주 생성 요청 데이터: ' . print_r($request->get_params(), true));
    return $order;
}, 10, 2);

add_action('woocommerce_order_status_changed', function($order_id, $old_status, $new_status) {
    error_log(sprintf(
        '주문 상태 변경 - Order ID: %s, Old Status: %s, New Status: %s',
        $order_id,
        $old_status,
        $new_status
    ));
}, 10, 3);

// 비로그인 사용자 카트 기능 활성화
add_filter('woocommerce_persistent_cart_enabled', '__return_true');

// 비로그인 사용자 카트 키 설정
add_filter('woocommerce_cart_session_key', function($key, $customer_id) {
    if ($customer_id === 0) {
        if (!isset($_SESSION['guest_cart_key'])) {
            $_SESSION['guest_cart_key'] = wp_generate_uuid4();
        }
        return 'guest_cart_' . $_SESSION['guest_cart_key'];
    }
    return $key;
}, 10, 2);

// 카트 저장 간격 설정
add_filter('woocommerce_cart_session_save_interval', function() {
    return 60 * 60; // 1시간
});

// 게스트 카트 데이터 저장
add_action('woocommerce_cart_updated', function() {
    if (!is_user_logged_in() && isset($_SESSION['guest_cart_key'])) {
        $cart_key = 'guest_cart_' . $_SESSION['guest_cart_key'];
        $cart_content = WC()->cart->get_cart_for_session();
        set_transient($cart_key, $cart_content, 60 * 60 * 24); // 24시간 유지
    }
});

// 게스트 카트 데이터 복원
add_action('woocommerce_cart_loaded_from_session', function() {
    if (!is_user_logged_in() && isset($_SESSION['guest_cart_key'])) {
        $cart_key = 'guest_cart_' . $_SESSION['guest_cart_key'];
        $cart_content = get_transient($cart_key);
        if ($cart_content) {
            WC()->cart->set_cart_contents($cart_content);
        }
    }
});

// REST API 인증 설정 수정
add_filter('rest_authentication_errors', function($result) {
    // Basic Auth 헤더 확인
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strpos($auth_header, 'Basic ') === 0) {
        $auth = explode(':', base64_decode(substr($auth_header, 6)));
        if (count($auth) === 2) {
            $key = $auth[0];
            $secret = $auth[1];
            
            // WooCommerce API 키 확인
            if ($key === 'ck_413d08035bd5410c864d1d9043e9f4d3a36c7948' && 
                $secret === 'cs_1e26cbadb40d10c264ebb01661b27e45512b5ab7') {
                return true;
            }
        }
    }

    // 일반 션 기반 인증 확인
    if (!is_user_logged_in()) {
        return new WP_Error(
            'rest_not_logged_in',
            '로그인이 필요합니다.',
            array('status' => 401)
        );
    }

    return $result;
});

// REST API 응답에 nonce 추가
add_filter('rest_prepare_user', function($response, $user, $request) {
    if (!empty($response->data)) {
        $response->data['nonce'] = wp_create_nonce('wp_rest');
    }
    return $response;
}, 10, 3);

// nonce 검증 비활성화 (테스트용)
add_filter('rest_cookie_check_errors', function($errors) {
    return new WP_Error();
}, 100);