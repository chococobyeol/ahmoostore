<?php

// 회원가입 폼 커스터마이즈
add_filter('register_form', 'custom_registration_form');
function custom_registration_form() {
    // 추가 필드 예시
    ?>
    <p>
        <label for="phone">전화번호</label>
        <input type="tel" name="phone" id="phone" class="input" />
    </p>
    <?php
}

// 회원가입 처리 시 추가 필드 저장
add_action('user_register', 'save_custom_registration_fields');
function save_custom_registration_fields($user_id) {
    if (!empty($_POST['phone'])) {
        update_user_meta($user_id, 'phone', sanitize_text_field($_POST['phone']));
    }
}

// REST API 사용자 등록 엔드포인트 추가
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'register_user_api',
        'permission_callback' => '__return_true'
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

    // 기본 역할을 customer로 설정
    $user = new WP_User($user_id);
    $user->set_role('customer');

    return array(
        'status' => 'success',
        'message' => '회원가입이 완료되었습니다.'
    );
}

// CORS 허용
add_action('init', function() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        status_header(200);
        exit();
    }
}); 